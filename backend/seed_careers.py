"""
Quick seed script to populate career catalog directly via the DB.
Run from: backend directory with .venv active
"""
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def seed():
    from app.db.session import get_session_factory
    from app.ml.seed_data import CAREER_SEED_DATA
    from app.models.career import Career
    from sqlalchemy import select, func

    factory = get_session_factory()
    async with factory() as session:
        # Check existing count
        result = await session.execute(select(func.count()).select_from(Career))
        count = result.scalar()
        print(f"Current careers in DB: {count}")

        if count >= len(CAREER_SEED_DATA):
            print("Already seeded! Nothing to do.")
            return

        # Insert all careers from seed data
        added = 0
        for data in CAREER_SEED_DATA:
            career = Career(
                title=data.get("title"),
                category=data.get("category"),
                short_description=data.get("short_description"),
                description=data.get("description"),
                median_salary_usd=data.get("median_salary_usd"),
                salary_range_low=data.get("salary_range_low"),
                salary_range_high=data.get("salary_range_high"),
                growth_rate_percent=data.get("growth_rate_percent"),
                automation_risk_percent=data.get("automation_risk_percent"),
                market_demand=data.get("market_demand"),
                job_outlook=data.get("job_outlook"),
                required_education=data.get("required_education"),
                typical_experience_years=data.get("typical_experience_years"),
                required_skills=data.get("required_skills", {}),
                preferred_skills=data.get("preferred_skills", {}),
                required_certifications=data.get("required_certifications", []),
                work_environment=data.get("work_environment"),
                is_active=True,
            )
            session.add(career)
            added += 1

        await session.commit()
        print(f"✅ Seeded {added} careers into the database!")

asyncio.run(seed())
