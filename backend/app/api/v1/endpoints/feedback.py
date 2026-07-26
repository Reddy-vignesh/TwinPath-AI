"""
API Endpoint for Feedback & Bug Reports.
"""
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
import jwt

from app.db.session import get_db
from app.models.feedback import FeedbackReport
from app.config import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackCreateRequest(BaseModel):
    report_type: str = "feedback"  # feedback, bug_report, feature_request
    category: Optional[str] = "general"
    rating: Optional[int] = 5
    message: str
    email: Optional[str] = None
    page_url: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackCreateRequest,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """
    Submit user feedback, bug report, or feature request.
    Stores in Supabase database and logs entry for email notification.
    """
    if not body.message or len(body.message.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_email = body.email
    user_id = None

    # Try extracting user info from JWT if provided
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            settings = get_settings()
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
            user_id_str = payload.get("sub")
            if user_id_str:
                import uuid
                user_id = uuid.UUID(user_id_str)
            if not user_email:
                user_email = payload.get("email")
        except Exception:
            pass  # Fallback to guest submission if token invalid/expired

    if not user_email:
        user_email = "Guest User"

    report = FeedbackReport(
        user_id=user_id,
        user_email=user_email,
        report_type=body.report_type,
        category=body.category,
        rating=body.rating,
        message=body.message,
        page_url=body.page_url,
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    logger.info(
        "Feedback submitted",
        report_id=str(report.id),
        type=body.report_type,
        user_email=user_email,
        destination_email="temporaryymail001@gmail.com"
    )

    # Dispatch email notification asynchronously to temporaryymail001@gmail.com
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://formsubmit.co/ajax/temporaryymail001@gmail.com",
                json={
                    "name": f"TwinPath AI - {body.report_type.upper()}",
                    "email": user_email,
                    "_subject": f"[TwinPath AI] New {body.report_type.replace('_', ' ').title()} Received!",
                    "message": f"Sender Email: {user_email}\nCategory: {body.category}\nRating: {body.rating} Stars\nPage URL: {body.page_url}\n\nMessage:\n{body.message}"
                },
                timeout=5.0
            )
    except Exception as email_err:
        logger.error("Failed to send email notification", error=str(email_err))

    return {
        "success": True,
        "message": "Thank you! Your feedback has been received and saved.",
        "data": {
            "report_id": str(report.id),
            "type": report.report_type,
            "created_at": report.created_at.isoformat() if report.created_at else None
        }
    }
