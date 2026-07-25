"""
Decision Twin AI — Academic Schemas.
"""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import TITLE_MAX_LENGTH


class CourseGradeCreate(BaseModel):
    course_name: str = Field(max_length=TITLE_MAX_LENGTH)
    course_code: str | None = Field(None, max_length=20)
    grade: str = Field(max_length=10)
    credits: float | None = Field(None, ge=0)
    semester: str | None = Field(None, max_length=20)


class CourseGradeRead(BaseModel):
    id: UUID
    course_name: str
    course_code: str | None = None
    grade: str
    credits: float | None = None
    semester: str | None = None

    model_config = {"from_attributes": True}


class AcademicRecordCreate(BaseModel):
    institution: str = Field(max_length=TITLE_MAX_LENGTH)
    degree: str = Field(max_length=TITLE_MAX_LENGTH)
    major: str = Field(max_length=TITLE_MAX_LENGTH)
    minor: str | None = Field(None, max_length=TITLE_MAX_LENGTH)
    cgpa: float | None = Field(None, ge=0, le=10)
    max_cgpa: float = Field(default=10.0, ge=1, le=100)
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    achievements: str | None = Field(None, max_length=2000)
    course_grades: list[CourseGradeCreate] | None = None


class AcademicRecordUpdate(BaseModel):
    institution: str | None = None
    degree: str | None = None
    major: str | None = None
    minor: str | None = None
    cgpa: float | None = None
    max_cgpa: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    achievements: str | None = None


class AcademicRecordRead(BaseModel):
    id: UUID
    institution: str
    degree: str
    major: str
    minor: str | None = None
    cgpa: float | None = None
    max_cgpa: float = 10.0
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    achievements: str | None = None
    course_grades: list[CourseGradeRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
