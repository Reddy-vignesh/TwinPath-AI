"""
Decision Twin AI — Recommendation Endpoints.

Career recommendation API with explainability, skill gaps,
and index management.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.schemas.recommendation import RecommendationRequest
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _get_service(session: AsyncSession = Depends(get_db)) -> RecommendationService:
    return RecommendationService(session)


@router.post("", summary="Get career recommendations")
async def get_recommendations(
    payload: RecommendationRequest | None = None,
    current_user: TokenPayload = Depends(get_current_user),
    service: RecommendationService = Depends(_get_service),
) -> dict[str, Any]:
    """
    Generate personalized career recommendations.

    Uses the student's complete Digital Twin data to produce
    ranked career suggestions with:
    - Similarity scores
    - Skill gap analysis
    - Explainable reasoning
    - Improvement suggestions
    """
    params = payload or RecommendationRequest()

    result = await service.get_recommendations(
        user_id=uuid.UUID(current_user.sub),
        top_k=params.top_k,
        include_skill_gap=params.include_skill_gap,
        include_explanation=params.include_explanation,
    )

    return success_response(
        data=result,
        message=f"Generated {len(result.get('recommendations', []))} recommendations.",
    )


@router.get("/quick", summary="Quick recommendations (no explanations)")
async def quick_recommendations(
    top_k: int = 5,
    current_user: TokenPayload = Depends(get_current_user),
    service: RecommendationService = Depends(_get_service),
) -> dict[str, Any]:
    """Fast recommendations without skill gaps or explanations."""
    result = await service.get_recommendations(
        user_id=uuid.UUID(current_user.sub),
        top_k=top_k,
        include_skill_gap=False,
        include_explanation=False,
    )
    return success_response(
        data=result,
        message=f"Generated {len(result.get('recommendations', []))} quick recommendations.",
    )


@router.post("/rebuild-index", summary="Rebuild career index (admin)")
async def rebuild_index(
    current_user: TokenPayload = Depends(get_current_user),
    service: RecommendationService = Depends(_get_service),
) -> dict[str, Any]:
    """Force rebuild the FAISS career similarity index."""
    from app.core.exceptions import ForbiddenException

    if current_user.role != "admin":
        raise ForbiddenException(message="Only admins can rebuild the career index.")

    count = await service.rebuild_index()
    return success_response(
        data={"careers_indexed": count},
        message=f"Career index rebuilt with {count} careers.",
    )
