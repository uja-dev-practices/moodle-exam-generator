from app.db.base import Base
from app.db.migrations import run_migrations
from app.db.session import engine
from app.models import exam, user  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
