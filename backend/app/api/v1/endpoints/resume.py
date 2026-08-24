"""
PDF Resume Parser Endpoint.
Extracts text, links (GitHub/LinkedIn/Portfolio), academic history, and matching skills from PDF resumes,
and returns structured data for the user to review and verify before saving to their Digital Twin.
"""
from typing import Any, List, Dict
import io
import re
import uuid
import structlog
from pypdf import PdfReader
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.skill import Skill
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
    Parse an uploaded PDF resume, extract links, academics, bio, and matching skills.
    Returns structured data for the user to verify, edit, and save freely.
    """
    # 1. Extension Check & Filename Sanitization
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    sanitized_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)

    try:
        contents = await file.read()
        
        # 2. Maximum File Size Limit (10MB ceiling)
        MAX_FILE_SIZE = 10 * 1024 * 1024
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({round(len(contents) / (1024*1024), 1)}MB). Maximum allowed size is 10MB.",
            )

        # 3. Magic-Byte Header Verification (must start with %PDF-)
        if not contents.startswith(b"%PDF-"):
            logger.warning("invalid_pdf_magic_bytes_detected", filename=sanitized_name, size=len(contents))
            raise HTTPException(
                status_code=400,
                detail="Invalid file content. The uploaded file is not a valid PDF document.",
            )

        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF resume.")

        text_clean = extracted_text.strip()
        lines = [line.strip() for line in text_clean.split("\n") if line.strip()]

        # ── 1. Extract Links (GitHub, LinkedIn, Portfolio) ─────────────────
        github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)', text_clean, re.IGNORECASE)
        github_url = f"https://github.com/{github_match.group(1)}" if github_match else None

        linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-%]+)', text_clean, re.IGNORECASE)
        linkedin_url = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None

        portfolio_match = re.search(r'https?://(?!github\.com|linkedin\.com|google\.com|gmail\.com)[\w\.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?', text_clean, re.IGNORECASE)
        portfolio_url = portfolio_match.group(0) if portfolio_match else None

        # ── 2. Extract Personal Info ──────────────────────────────────────
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}', text_clean)
        extracted_email = email_match.group(0) if email_match else None

        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text_clean)
        extracted_phone = phone_match.group(0) if phone_match else None

        # Try to infer name from first line if it looks like a person's name
        extracted_first_name = None
        extracted_last_name = None
        if lines:
            first_line = lines[0]
            words = first_line.split()
            if 1 <= len(words) <= 4 and not any(w in first_line.lower() for w in ['resume', 'curriculum', 'page', 'email', 'phone', 'http']):
                extracted_first_name = words[0]
                extracted_last_name = " ".join(words[1:]) if len(words) > 1 else ""

        # ── 3. Extract Academic Profile ───────────────────────────────────
        # Degree identification
        highest_degree = None
        degree_patterns = [
            (r'\b(b\.?tech(?:nology)?|b\.?e\.?|bachelor of technology|bachelor of engineering)\b', 'B.Tech', 'Undergraduate'),
            (r'\b(b\.?sc|bachelor of science)\b', 'B.Sc', 'Undergraduate'),
            (r'\b(bca|bachelor of computer applications)\b', 'BCA', 'Undergraduate'),
            (r'\b(bba|bachelor of business administration)\b', 'BBA', 'Undergraduate'),
            (r'\b(m\.?tech(?:nology)?|m\.?e\.?|master of technology|master of engineering)\b', 'M.Tech', 'Postgraduate'),
            (r'\b(mca|master of computer applications)\b', 'MCA', 'Postgraduate'),
            (r'\b(mba|master of business administration)\b', 'MBA', 'Postgraduate'),
            (r'\b(m\.?sc|master of science)\b', 'M.Sc', 'Postgraduate'),
            (r'\b(ph\.?d|doctor of philosophy)\b', 'Ph.D in Engineering / Computer Science', 'PhD'),
            (r'\b(diploma)\b', 'Polytechnic Diploma', 'Diploma'),
        ]
        
        education_level = 'Undergraduate'
        for pattern, deg_name, lvl in degree_patterns:
            if re.search(pattern, text_clean, re.IGNORECASE):
                highest_degree = deg_name
                education_level = lvl
                break

        # Major extraction
        major = None
        major_patterns = [
            (r'\bcomputer science(?: and engineering)?\b', 'Computer Science and Engineering'),
            (r'\bdata science\b', 'Data Science & Analytics'),
            (r'\bartificial intelligence\b', 'Artificial Intelligence & Machine Learning'),
            (r'\binformation technology\b', 'Information Technology'),
            (r'\belectronics(?: and communication)?\b', 'Electronics & Communication Engineering'),
            (r'\belectrical(?: and electronics)?\b', 'Electrical & Electronics Engineering'),
            (r'\bmechanical engineering\b', 'Mechanical Engineering'),
        ]
        for pattern, maj_name in major_patterns:
            if re.search(pattern, text_clean, re.IGNORECASE):
                major = maj_name
                break

        # CGPA extraction
        cgpa = None
        cgpa_match = re.search(r'(?:cgpa|gpa|score)[:\s]*([0-9]+(?:\.[0-9]+)?)(?:\s*/\s*10|\s*/\s*4)?', text_clean, re.IGNORECASE)
        if cgpa_match:
            try:
                val = float(cgpa_match.group(1))
                if 0.0 <= val <= 10.0:
                    cgpa = val
            except Exception:
                pass

        # Graduation year extraction
        grad_year = None
        year_match = re.search(r'\b(201[8-9]|202[0-9]|2030)\b', text_clean)
        if year_match:
            try:
                grad_year = int(year_match.group(1))
            except Exception:
                pass

        # ── 4. Match Taxonomy Skills ──────────────────────────────────────
        result = await db.execute(select(Skill))
        all_skills = result.scalars().all()

        extracted_text_lower = text_clean.lower()
        matched_skills_data: List[Dict[str, Any]] = []

        for skill in all_skills:
            pattern = r'\b' + re.escape(skill.name.lower()) + r'\b'
            if re.search(pattern, extracted_text_lower):
                matched_skills_data.append({
                    "skill_id": str(skill.id),
                    "name": skill.name,
                    "category": skill.category,
                    "proficiency_level": 8,  # Advanced default for parsed skills
                    "source": "Personal Projects, Academic",
                })

        logger.info(
            "Resume Parsed For Verification",
            user_id=str(current_user.sub),
            matched_skills_count=len(matched_skills_data),
            has_github=bool(github_url),
            has_linkedin=bool(linkedin_url)
        )

        return success_response(
            data={
                "extracted_fields": {
                    "first_name": extracted_first_name,
                    "last_name": extracted_last_name,
                    "email": extracted_email,
                    "phone": extracted_phone,
                    "github_url": github_url,
                    "linkedin_url": linkedin_url,
                    "portfolio_url": portfolio_url,
                    "education_level": education_level,
                    "highest_degree": highest_degree,
                    "current_major": major,
                    "current_cgpa": cgpa,
                    "graduation_year": grad_year,
                },
                "matched_skills": matched_skills_data,
                "matched_count": len(matched_skills_data),
            },
            message=f"Resume parsed! Found {len(matched_skills_data)} skills and profile attributes. Please review and verify below."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Resume parse error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
