import base64
import json
from html import escape as html_escape
from pathlib import Path
from typing import Any
from uuid import UUID
from xml.sax.saxutils import escape as xml_escape

from app.core.security import clean_text


class MoodleXMLExporter:
    def export_xml(self, questions: list[Any], image_map: dict[UUID, Any] | None = None) -> str:
        images = image_map or {}
        parts = ['<?xml version="1.0" encoding="UTF-8"?>', "<quiz>"]
        for index, question in enumerate(questions, start=1):
            parts.append(self._export_question(question, index, images))
        parts.append("</quiz>")
        return "\n".join(parts)

    def export_txt(self, questions: list[Any]) -> str:
        blocks: list[str] = []
        for question in questions:
            lines = [self._attr(question, "statement")]
            if self._attr(question, "image_id"):
                lines.append(f"[Imagen adjunta: {self._attr(question, 'image_id')}]")
            lines.extend(self._attr(question, "correct_answers") or [])
            lines.extend(self._attr(question, "wrong_answers") or [])
            blocks.append("\n".join(clean_text(str(line)) for line in lines))
        return "\n\n".join(blocks)

    def export_json(self, questions: list[Any]) -> str:
        payload = {"questions": [self._question_dict(question) for question in questions]}
        return json.dumps(payload, ensure_ascii=False, indent=2, default=str)

    def _export_question(self, question: Any, index: int, image_map: dict[UUID, Any]) -> str:
        question_type = self._enum_value(self._attr(question, "question_type"))
        if question_type == "multichoice":
            return self._multichoice(question, index, image_map)
        if question_type == "truefalse":
            return self._truefalse(question, index, image_map)
        if question_type == "shortanswer":
            return self._shortanswer(question, index, image_map)
        if question_type == "matching":
            return self._matching(question, index, image_map)
        raise ValueError(f"Unsupported Moodle question type: {question_type}")

    def _multichoice(self, question: Any, index: int, image_map: dict[UUID, Any]) -> str:
        correct_answers = self._attr(question, "correct_answers") or []
        wrong_answers = self._attr(question, "wrong_answers") or []
        options = self._attr(question, "options") or {}
        multiple_correct = bool(options.get("multiple_correct", len(correct_answers) > 1))
        correct_fraction = 100 / max(len(correct_answers), 1)
        wrong_fraction = -abs(float(self._attr(question, "penalty") or 0.0)) if self._attr(question, "penalty") else 0

        answers = [
            self._answer_xml(answer, correct_fraction) for answer in correct_answers
        ] + [self._answer_xml(answer, wrong_fraction) for answer in wrong_answers]

        return "\n".join(
            [
                '  <question type="multichoice">',
                *self._common_header(question, index, image_map),
                f"    <single>{str(not multiple_correct).lower()}</single>",
                "    <shuffleanswers>1</shuffleanswers>",
                *answers,
                "  </question>",
            ]
        )

    def _truefalse(self, question: Any, index: int, image_map: dict[UUID, Any]) -> str:
        correct = (self._attr(question, "correct_answers") or ["true"])[0].lower()
        is_true = correct in {"true", "verdadero"}
        return "\n".join(
            [
                '  <question type="truefalse">',
                *self._common_header(question, index, image_map),
                self._answer_xml("true", 100 if is_true else 0),
                self._answer_xml("false", 0 if is_true else 100),
                "  </question>",
            ]
        )

    def _shortanswer(self, question: Any, index: int, image_map: dict[UUID, Any]) -> str:
        answers = [self._answer_xml(answer, 100) for answer in self._attr(question, "correct_answers")]
        return "\n".join(
            [
                '  <question type="shortanswer">',
                *self._common_header(question, index, image_map),
                "    <usecase>0</usecase>",
                *answers,
                "  </question>",
            ]
        )

    def _matching(self, question: Any, index: int, image_map: dict[UUID, Any]) -> str:
        subquestions = []
        for pair in self._attr(question, "matching_pairs") or []:
            prompt = pair.get("prompt") if isinstance(pair, dict) else pair.prompt
            answer = pair.get("answer") if isinstance(pair, dict) else pair.answer
            subquestions.append(
                "\n".join(
                    [
                        '    <subquestion format="html">',
                        f"      <text>{self._cdata(prompt)}</text>",
                        "      <answer>",
                        f"        <text>{self._xml(answer)}</text>",
                        "      </answer>",
                        "    </subquestion>",
                    ]
                )
            )
        return "\n".join(
            [
                '  <question type="matching">',
                *self._common_header(question, index, image_map),
                *subquestions,
                "  </question>",
            ]
        )

    def _common_header(self, question: Any, index: int, image_map: dict[UUID, Any]) -> list[str]:
        statement = self._attr(question, "statement")
        name = clean_text(statement, max_length=80) or f"Pregunta {index}"
        return [
            "    <name>",
            f"      <text>{self._xml(name)}</text>",
            "    </name>",
            '    <questiontext format="html">',
            f"      <text>{self._question_html(question, image_map)}</text>",
            "    </questiontext>",
            *self._embedded_files(question, image_map),
            f"    <defaultgrade>{float(self._attr(question, 'score') or 1.0):.2f}</defaultgrade>",
            '    <generalfeedback format="html"><text></text></generalfeedback>',
        ]

    def _question_html(self, question: Any, image_map: dict[UUID, Any]) -> str:
        statement = html_escape(clean_text(str(self._attr(question, "statement"))))
        html_parts = [f"<p>{statement}</p>"]

        image = self._resolve_image(question, image_map)
        if image is not None:
            alt = html_escape(clean_text(image.caption or image.original_filename, max_length=200))
            html_parts.append(
                f'<p><img src="@@PLUGINFILE@@/{image.stored_filename}" alt="{alt}" /></p>'
            )

        return self._cdata("".join(html_parts))

    def _embedded_files(self, question: Any, image_map: dict[UUID, Any]) -> list[str]:
        image = self._resolve_image(question, image_map)
        if image is None:
            return []

        path = Path(image.storage_path)
        if not path.exists():
            return []

        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        return [
            f'    <file name="{self._xml(image.stored_filename)}" path="/" encoding="base64">',
            encoded,
            "    </file>",
        ]

    def _resolve_image(self, question: Any, image_map: dict[UUID, Any]) -> Any | None:
        image_id = self._attr(question, "image_id")
        if image_id is None:
            return None
        if hasattr(question, "image") and question.image is not None:
            return question.image
        return image_map.get(image_id)

    def _answer_xml(self, text: str, fraction: float) -> str:
        fraction_text = f"{fraction:.6g}"
        return "\n".join(
            [
                f'    <answer fraction="{fraction_text}" format="html">',
                f"      <text>{self._xml(text)}</text>",
                '      <feedback format="html"><text></text></feedback>',
                "    </answer>",
            ]
        )

    def _question_dict(self, question: Any) -> dict[str, Any]:
        return {
            "id": str(self._attr(question, "id")) if self._attr(question, "id") else None,
            "question_type": self._enum_value(self._attr(question, "question_type")),
            "statement": self._attr(question, "statement"),
            "image_id": str(self._attr(question, "image_id")) if self._attr(question, "image_id") else None,
            "correct_answers": self._attr(question, "correct_answers") or [],
            "wrong_answers": self._attr(question, "wrong_answers") or [],
            "matching_pairs": self._attr(question, "matching_pairs") or [],
            "difficulty": self._enum_value(self._attr(question, "difficulty")),
            "score": self._attr(question, "score"),
            "penalty": self._attr(question, "penalty"),
        }

    def _attr(self, question: Any, name: str) -> Any:
        return getattr(question, name, None)

    def _enum_value(self, value: Any) -> Any:
        return value.value if hasattr(value, "value") else value

    def _xml(self, value: Any) -> str:
        return xml_escape(clean_text(str(value)), {'"': "&quot;", "'": "&apos;"})

    def _cdata(self, value: Any) -> str:
        text = str(value).replace("]]>", "]]]]><![CDATA[>")
        return f"<![CDATA[{text}]]>"
