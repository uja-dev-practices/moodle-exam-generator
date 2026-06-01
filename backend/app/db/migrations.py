"""
Migraciones ligeras e idempotentes para bases de datos creadas antes de nuevas columnas.
Se ejecutan en cada arranque; solo aplican cambios que falten.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def run_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    with engine.begin() as conn:
        if "users" in table_names and "exam_templates" in table_names:
            _ensure_exam_templates_user_id(conn, inspector)

        if "questions" in table_names:
            _ensure_questions_image_id(conn, inspector)

        if "exam_materials" in table_names:
            _ensure_material_status_enum(conn)


def _column_names(inspector, table: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table)}


def _ensure_exam_templates_user_id(conn, inspector) -> None:
    if "user_id" in _column_names(inspector, "exam_templates"):
        return

    conn.execute(
        text("ALTER TABLE exam_templates ADD COLUMN user_id UUID")
    )

    # Plantillas antiguas (sin usuario): asignar al primer usuario registrado.
    conn.execute(
        text(
            """
            UPDATE exam_templates
            SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
            WHERE user_id IS NULL
              AND EXISTS (SELECT 1 FROM users)
            """
        )
    )
    # Si no hay usuarios o filas huérfanas, eliminar plantillas sin dueño.
    conn.execute(text("DELETE FROM exam_templates WHERE user_id IS NULL"))

    conn.execute(text("ALTER TABLE exam_templates ALTER COLUMN user_id SET NOT NULL"))
    conn.execute(
        text(
            """
            ALTER TABLE exam_templates
            ADD CONSTRAINT fk_exam_templates_user_id
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            """
        )
    )
    conn.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_exam_templates_user_id ON exam_templates (user_id)"
        )
    )


def _ensure_questions_image_id(conn, inspector) -> None:
    if "image_id" in _column_names(inspector, "questions"):
        return

    if "exam_images" not in set(inspector.get_table_names()):
        return

    conn.execute(text("ALTER TABLE questions ADD COLUMN image_id UUID"))
    conn.execute(
        text(
            """
            ALTER TABLE questions
            ADD CONSTRAINT fk_questions_image_id
            FOREIGN KEY (image_id) REFERENCES exam_images(id) ON DELETE SET NULL
            """
        )
    )
    conn.execute(
        text("CREATE INDEX IF NOT EXISTS ix_questions_image_id ON questions (image_id)")
    )


def _ensure_material_status_enum(conn) -> None:
    # Asegura el tipo enum de PostgreSQL usado por exam_materials.status.
    conn.execute(
        text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'materialstatus') THEN
                    CREATE TYPE materialstatus AS ENUM ('processed', 'failed');
                END IF;
            END
            $$;
            """
        )
    )
