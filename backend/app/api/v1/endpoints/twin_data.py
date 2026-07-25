"""
Decision Twin AI — Academics, Certifications, Projects Endpoints.

Grouped as they share the same pattern: profile-scoped CRUD.
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success_response
from app.core.security import TokenPayload, get_current_user
from app.db.session import get_db
from app.schemas.academic import (
    AcademicRecordCreate,
    AcademicRecordRead,
    AcademicRecordUpdate,
)
from app.schemas.certification import (
    CertificationCreate,
    CertificationRead,
    CertificationUpdate,
)
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.twin_service import TwinDataService


# ══════════════════════════════════════════════════════════════════
# ACADEMICS
# ══════════════════════════════════════════════════════════════════

academics_router = APIRouter(prefix="/academics", tags=["Academics"])


def _get_service(session: AsyncSession = Depends(get_db)) -> TwinDataService:
    return TwinDataService(session)


@academics_router.get("", summary="Get my academic records")
async def get_academics(
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    records = await service.get_academic_records(uuid.UUID(current_user.sub))
    return success_response(
        data=[AcademicRecordRead.model_validate(r).model_dump(mode="json") for r in records],
        message=f"Found {len(records)} academic records.",
    )


@academics_router.post("", summary="Add academic record", status_code=201)
async def add_academic(
    payload: AcademicRecordCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    record = await service.add_academic_record(uuid.UUID(current_user.sub), payload)
    return success_response(
        data=AcademicRecordRead.model_validate(record).model_dump(mode="json"),
        message="Academic record added.",
    )


@academics_router.patch("/{record_id}", summary="Update academic record")
async def update_academic(
    record_id: uuid.UUID,
    payload: AcademicRecordUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    updated = await service.update_academic_record(
        uuid.UUID(current_user.sub), record_id, payload
    )
    return success_response(
        data=AcademicRecordRead.model_validate(updated).model_dump(mode="json"),
        message="Academic record updated.",
    )


@academics_router.delete("/{record_id}", summary="Delete academic record")
async def delete_academic(
    record_id: uuid.UUID,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    await service.remove_academic_record(uuid.UUID(current_user.sub), record_id)
    return success_response(data=None, message="Academic record deleted.")


# ══════════════════════════════════════════════════════════════════
# CERTIFICATIONS
# ══════════════════════════════════════════════════════════════════

certifications_router = APIRouter(prefix="/certifications", tags=["Certifications"])


@certifications_router.get("", summary="Get my certifications")
async def get_certifications(
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    certs = await service.get_certifications(uuid.UUID(current_user.sub))
    return success_response(
        data=[CertificationRead.model_validate(c).model_dump(mode="json") for c in certs],
        message=f"Found {len(certs)} certifications.",
    )


@certifications_router.post("", summary="Add certification", status_code=201)
async def add_certification(
    payload: CertificationCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    cert = await service.add_certification(uuid.UUID(current_user.sub), payload)
    return success_response(
        data=CertificationRead.model_validate(cert).model_dump(mode="json"),
        message="Certification added.",
    )


@certifications_router.patch("/{cert_id}", summary="Update certification")
async def update_certification(
    cert_id: uuid.UUID,
    payload: CertificationUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    updated = await service.update_certification(
        uuid.UUID(current_user.sub), cert_id, payload
    )
    return success_response(
        data=CertificationRead.model_validate(updated).model_dump(mode="json"),
        message="Certification updated.",
    )


@certifications_router.delete("/{cert_id}", summary="Delete certification")
async def delete_certification(
    cert_id: uuid.UUID,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    await service.remove_certification(uuid.UUID(current_user.sub), cert_id)
    return success_response(data=None, message="Certification deleted.")


# ══════════════════════════════════════════════════════════════════
# PROJECTS
# ══════════════════════════════════════════════════════════════════

projects_router = APIRouter(prefix="/projects", tags=["Projects"])


@projects_router.get("", summary="Get my projects")
async def get_projects(
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    projects = await service.get_projects(uuid.UUID(current_user.sub))
    return success_response(
        data=[ProjectRead.model_validate(p).model_dump(mode="json") for p in projects],
        message=f"Found {len(projects)} projects.",
    )


@projects_router.post("", summary="Add project", status_code=201)
async def add_project(
    payload: ProjectCreate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    project = await service.add_project(uuid.UUID(current_user.sub), payload)
    return success_response(
        data=ProjectRead.model_validate(project).model_dump(mode="json"),
        message="Project added.",
    )


@projects_router.patch("/{project_id}", summary="Update project")
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    updated = await service.update_project(
        uuid.UUID(current_user.sub), project_id, payload
    )
    return success_response(
        data=ProjectRead.model_validate(updated).model_dump(mode="json"),
        message="Project updated.",
    )


@projects_router.delete("/{project_id}", summary="Delete project")
async def delete_project(
    project_id: uuid.UUID,
    current_user: TokenPayload = Depends(get_current_user),
    service: TwinDataService = Depends(_get_service),
) -> dict[str, Any]:
    await service.remove_project(uuid.UUID(current_user.sub), project_id)
    return success_response(data=None, message="Project deleted.")
