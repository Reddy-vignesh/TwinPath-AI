"""
PDF Resume Parser Endpoint.
Extracts text from uploaded PDF resumes and automatically extracts matching skills from the skill taxonomy.
"""
from typing import Any, List, Dict
import io
import re
import structlog
from pypdf import PdfReader
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.skill import Skill, UserSkill
from app.models.profile import StudentProfile
from app.core.security import TokenPayload, get_current_user
from app.core.response import success_response

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/profiles/upload-resume", tags=["Resume Parser"])


@router.post("", status_code=status.HTTP_200_OK)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Parse an uploaded PDF resume, extract matching skills, and auto-populate the user's profile.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF resume.")

        # Get all taxonomy skills from database
        result = await db.execute(select(Skill))
        all_skills = result.scalars().all()

        extracted_text_lower = extracted_text.lower()
        matched_skills: List[Skill] = []

        for skill in all_skills:
            # Word boundary regex search to prevent substring matches (e.g. 'c' in 'cat')
            pattern = r'\b' + re.escape(skill.name.lower()) + r'\b'
            if re.search(pattern, extracted_text_lower):
                matched_skills.append(skill)

        # Import uuid
        import uuid
        user_uuid = uuid.UUID(current_user.sub)

        # Retrieve student profile
        prof_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user_uuid))
        profile = prof_res.scalars().first()

        if not profile:
            profile = StudentProfile(user_id=user_uuid, twin_completeness_score=0.1)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        # Add matched skills to UserSkill
        existing_skills_res = await db.execute(select(UserSkill.skill_id).where(UserSkill.profile_id == profile.id))
        existing_skill_ids = set(existing_skills_res.scalars().all())

        added_count = 0
        added_names = []

        for skill in matched_skills:
            if skill.id not in existing_skill_ids:
                user_skill = UserSkill(
                    profile_id=profile.id,
                    skill_id=skill.id,
                    proficiency_level=7,  # Default high proficiency extracted from resume
                    years_experience=2
                )
                db.add(user_skill)
                added_count += 1
                added_names.append(skill.name)

        # Update profile twin completeness score
        total_skills_res = await db.execute(select(UserSkill).where(UserSkill.profile_id == profile.id))
        total_count = len(total_skills_res.scalars().all()) + added_count
        profile.total_skills_count = total_count
        profile.twin_completeness_score = min(1.0, max(0.2, total_count * 0.1))
        
        await db.commit()

        logger.info(
            "Resume Parsed Successfully",
            user_id=str(user_uuid),
            matched_count=len(matched_skills),
            added_count=added_count
        )

        return success_response(
            data={
                "extracted_skills_count": len(matched_skills),
                "newly_added_skills": added_names,
                "total_profile_skills": total_count,
                "twin_completeness": profile.twin_completeness_score
            },
            message=f"Resume parsed! Added {added_count} new skills to your Digital Twin."
        )

    except Exception as e:
        logger.error("Resume parse error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
