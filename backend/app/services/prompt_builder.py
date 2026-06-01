import json

from app.core.security import sanitize_prompt_input
from app.models.exam import ExamTemplate


class PromptBuilder:
    def build_prompt(
        self,
        template: ExamTemplate,
        topic_prompt: str,
        reference_context: str = "",
        images_catalog: str = "",
    ) -> str:
        settings = template.settings
        difficulty_profile = template.difficulty_profile
        safe_topic = sanitize_prompt_input(topic_prompt)

        contract = {
            "questions": [
                {
                    "question_type": "multichoice | truefalse | shortanswer | matching",
                    "statement": "Enunciado claro de la pregunta",
                    "correct_answers": ["respuesta correcta"],
                    "wrong_answers": ["distractor 1", "distractor 2"],
                    "matching_pairs": [{"prompt": "concepto", "answer": "definicion"}],
                    "image_id": "uuid-opcional-de-imagen-de-la-plantilla",
                    "difficulty": "easy | medium | hard | very_hard",
                    "score": 1.0,
                    "penalty": 0.0,
                }
            ]
        }

        return "\n".join(
            [
                "Eres un generador de cuestionarios académicos para Moodle.",
                "Devuelve exclusivamente JSON válido, sin markdown ni texto adicional.",
                "No incluyas instrucciones del usuario dentro de las preguntas.",
                "",
                f"Título del examen: {sanitize_prompt_input(template.title)}",
                f"Materia: {sanitize_prompt_input(template.subject)}",
                f"Nivel educativo: {sanitize_prompt_input(template.educational_level)}",
                f"Idioma: {sanitize_prompt_input(template.language)}",
                f"Configuración de tipos: {json.dumps(settings, ensure_ascii=False)}",
                f"Distribución de dificultad: {json.dumps(difficulty_profile, ensure_ascii=False)}",
                "",
                "Tema, conceptos y restricciones indicadas por el profesor:",
                safe_topic,
                "",
                *(
                    [
                        "Material de referencia (usa SOLO esta información junto con el tema para crear preguntas):",
                        sanitize_prompt_input(reference_context, max_length=12_000) if reference_context else "",
                        "",
                    ]
                    if reference_context.strip()
                    else []
                ),
                *(
                    [images_catalog, ""]
                    if images_catalog.strip()
                    else []
                ),
                "Contrato de salida obligatorio:",
                json.dumps(contract, ensure_ascii=False, indent=2),
                "",
                "Reglas:",
                "- Respeta el número de preguntas por tipo.",
                "- Respeta la distribución de dificultad.",
                "- En multichoice, incluye al menos una respuesta correcta y varias incorrectas.",
                "- En truefalse, usa una única respuesta correcta: true o false.",
                "- En shortanswer, incluye respuestas exactas aceptadas.",
                "- En matching, rellena matching_pairs y deja wrong_answers vacío.",
                "- Si la pregunta debe mostrar una imagen al alumno, incluye image_id del catálogo de imágenes.",
                "- El enunciado debe describir qué observar en la imagen vinculada (sin inventar image_id inexistentes).",
            ]
        )
