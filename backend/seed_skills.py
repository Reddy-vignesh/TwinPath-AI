"""
Seed the skill catalog with common tech/business skills.
Run from backend directory with .venv active.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SKILL_SEED = [
    # Programming
    ("Python", "programming", "General-purpose interpreted language widely used in data science and web development"),
    ("JavaScript", "programming", "The language of the web, used for both frontend and backend (Node.js) development"),
    ("TypeScript", "programming", "Typed superset of JavaScript that compiles to plain JS"),
    ("Java", "programming", "Object-oriented language widely used in enterprise applications"),
    ("C++", "programming", "High-performance compiled language used in systems, games, and robotics"),
    ("C", "programming", "Low-level systems programming language"),
    ("Go", "programming", "Fast, statically typed language built for concurrency at scale"),
    ("Rust", "programming", "Memory-safe systems language focused on performance and reliability"),
    ("R", "programming", "Statistical computing language popular in data science"),
    ("Kotlin", "programming", "Modern JVM language used for Android and backend development"),
    ("Swift", "programming", "Apple's modern language for iOS and macOS apps"),
    ("PHP", "programming", "Server-side scripting language common in web development"),
    ("Ruby", "programming", "Dynamic language known for its clean syntax and Rails framework"),
    ("Scala", "programming", "Functional/OOP JVM language used in big data pipelines"),
    ("MATLAB", "programming", "Numerical computing environment used in engineering and science"),
    # Web
    ("React", "web_development", "Popular JavaScript library for building user interfaces"),
    ("Vue.js", "web_development", "Progressive JavaScript framework for building UIs"),
    ("Angular", "web_development", "Full-featured TypeScript framework by Google"),
    ("Next.js", "web_development", "React framework for server-side rendering and static generation"),
    ("Node.js", "web_development", "JavaScript runtime for building backend services"),
    ("FastAPI", "web_development", "Modern Python web framework for building APIs"),
    ("Django", "web_development", "High-level Python web framework"),
    ("Flask", "web_development", "Lightweight Python web microframework"),
    ("Spring Boot", "web_development", "Java framework for building production-ready applications"),
    ("GraphQL", "web_development", "Query language for APIs as an alternative to REST"),
    ("REST APIs", "web_development", "Architectural style for designing networked applications"),
    ("HTML", "web_development", "Standard markup language for web pages"),
    ("CSS", "web_development", "Stylesheet language for designing web page appearance"),
    # Data / ML
    ("Machine Learning", "data_science", "Building systems that learn from data to make predictions"),
    ("Deep Learning", "data_science", "Neural network techniques for complex pattern recognition"),
    ("Natural Language Processing", "data_science", "Techniques for understanding and generating human language"),
    ("Computer Vision", "data_science", "Teaching machines to interpret and understand visual data"),
    ("TensorFlow", "data_science", "Google's open-source ML framework"),
    ("PyTorch", "data_science", "Facebook's flexible ML framework popular in research"),
    ("Scikit-learn", "data_science", "Python library for classical machine learning algorithms"),
    ("Pandas", "data_science", "Python library for data manipulation and analysis"),
    ("NumPy", "data_science", "Fundamental package for numerical computing in Python"),
    ("Data Visualization", "data_science", "Creating charts, dashboards and visual representations of data"),
    ("Statistics", "data_science", "Mathematical foundation for data analysis and inference"),
    ("Linear Algebra", "data_science", "Mathematical foundation used in ML and data science"),
    ("Tableau", "data_science", "Visual analytics platform for business intelligence"),
    ("Power BI", "data_science", "Microsoft's business analytics service"),
    ("A/B Testing", "data_science", "Controlled experiments to compare two versions of a product"),
    # Databases
    ("SQL", "database", "Standard language for querying relational databases"),
    ("PostgreSQL", "database", "Advanced open-source relational database"),
    ("MySQL", "database", "Most popular open-source relational database"),
    ("MongoDB", "database", "Leading NoSQL document database"),
    ("Redis", "database", "In-memory data structure store used as cache and message broker"),
    ("Elasticsearch", "database", "Distributed search and analytics engine"),
    ("Cassandra", "database", "Highly scalable NoSQL database for large-scale data"),
    # Cloud / DevOps
    ("AWS", "cloud_devops", "Amazon Web Services — the leading cloud computing platform"),
    ("Google Cloud", "cloud_devops", "Google's suite of cloud computing services"),
    ("Azure", "cloud_devops", "Microsoft's cloud computing platform"),
    ("Docker", "cloud_devops", "Platform for containerizing and deploying applications"),
    ("Kubernetes", "cloud_devops", "Container orchestration system for automating deployments"),
    ("CI/CD", "cloud_devops", "Continuous integration and delivery practices for automated deployments"),
    ("Terraform", "cloud_devops", "Infrastructure as code tool for cloud resource management"),
    ("Linux", "cloud_devops", "Open-source operating system essential for server environments"),
    ("Git", "cloud_devops", "Distributed version control system for tracking code changes"),
    ("System Design", "cloud_devops", "Designing scalable, reliable, and maintainable software systems"),
    # Business / Management
    ("Product Management", "business", "Overseeing product development from ideation to launch"),
    ("Project Management", "business", "Planning, executing, and closing projects on time and budget"),
    ("Leadership", "business", "Guiding, motivating, and managing teams toward a goal"),
    ("Strategic Thinking", "business", "Long-term planning and decision-making at an organizational level"),
    ("Communication", "business", "Effectively conveying information to diverse audiences"),
    ("Problem Solving", "business", "Systematically identifying and resolving challenges"),
    ("Data Analysis", "business", "Collecting, processing, and interpreting data to support decisions"),
    ("Financial Planning", "business", "Managing budgets, forecasts, and financial resources"),
    ("Marketing", "business", "Promoting products and services to target audiences"),
    ("Sales", "business", "Identifying and converting potential customers"),
    ("Fundraising", "business", "Securing financial resources for organizations or startups"),
    ("Agile / Scrum", "business", "Iterative project management methodologies"),
    # Design
    ("UI/UX Design", "design", "Designing user interfaces and experiences that are intuitive and beautiful"),
    ("Figma", "design", "Collaborative interface design tool used in product teams"),
    ("Adobe XD", "design", "User experience design software by Adobe"),
    ("Graphic Design", "design", "Creating visual content to communicate messages"),
    ("User Research", "design", "Understanding user needs through interviews, surveys, and testing"),
    ("Prototyping", "design", "Creating working models of designs to test and iterate"),
    # Networking / Security
    ("Cybersecurity", "security", "Protecting systems and data from digital attacks"),
    ("Network Security", "security", "Securing computer networks from unauthorized access"),
    ("Ethical Hacking", "security", "Authorized testing of systems to identify vulnerabilities"),
    ("Cryptography", "security", "Techniques for securing information through encoding"),
    # Soft Skills
    ("Critical Thinking", "soft_skills", "Analyzing information objectively to make reasoned judgments"),
    ("Time Management", "soft_skills", "Efficiently organizing and prioritizing tasks and deadlines"),
    ("Teamwork", "soft_skills", "Working collaboratively with others toward shared goals"),
    ("Adaptability", "soft_skills", "Adjusting effectively to new situations and changing requirements"),
    ("Research", "soft_skills", "Systematically investigating topics to gather information"),
    # Engineering
    ("Embedded Systems", "engineering", "Hardware and software systems with real-time constraints"),
    ("Control Systems", "engineering", "Designing systems that regulate behavior of other systems"),
    ("Signal Processing", "engineering", "Analysis, modification, and synthesis of signals"),
    ("CAD", "engineering", "Computer-aided design for creating 2D/3D technical drawings"),
    ("ROS", "engineering", "Robot Operating System — middleware for robotics applications"),
]

async def seed_skills():
    from app.db.session import get_session_factory
    from app.models.skill import Skill
    from sqlalchemy import select, func

    factory = get_session_factory()
    async with factory() as session:
        result = await session.execute(select(func.count()).select_from(Skill))
        count = result.scalar()
        print(f"Current skills in catalog: {count}")

        if count >= len(SKILL_SEED):
            print("Skills already seeded!")
            return

        added = 0
        for name, category, desc in SKILL_SEED:
            # Check if already exists
            existing = await session.execute(
                select(Skill).where(Skill.name == name)
            )
            if existing.scalar_one_or_none():
                continue

            skill = Skill(
                name=name,
                category=category,
                description=desc,
            )
            session.add(skill)
            added += 1

        await session.commit()
        print(f"Seeded {added} skills into the catalog!")

asyncio.run(seed_skills())
