import json
from typing import Any

from pydantic import ValidationError

from app.core.errors import ParseError
from app.core.security import clean_text
from app.models.exam import Difficulty, QuestionType
from app.schemas.exam import QuestionCreate


class AIQuestionParser:
    def parse(self, raw_output: str, input_format: str) -> list[QuestionCreate]:
        if input_format == "json":
            return self.parse_json(raw_output)
        if input_format == "txt":
            return self.parse_txt(raw_output)
        raise ParseError("Unsupported input format")

    def parse_json(self, raw_json: str) -> list[QuestionCreate]:
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise ParseError("Invalid JSON returned by AI") from exc

        items = data.get("questions", data) if isinstance(data, dict) else data
        if not isinstance(items, list) or not items:
            raise ParseError("JSON must contain a non-empty questions list")

        questions: list[QuestionCreate] = []
        for item in items:
            if not isinstance(item, dict):
                raise ParseError("Each JSON question must be an object")
            questions.append(self._build_question(self._normalize_item(item)))
        return questions

    def parse_txt(self, raw_text: str) -> list[QuestionCreate]:
        blocks = [block.strip() for block in raw_text.replace("\r\n", "\n").split("\n\n") if block.strip()]
        questions: list[QuestionCreate] = []

        for block in blocks:
            lines = [clean_text(line) for line in block.split("\n") if clean_text(line)]
            if len(lines) < 2:
                continue

            statement = lines[0]
            correct_answer = lines[1]
            wrong_answers = lines[2:]
            question_type = self._infer_txt_type(correct_answer, wrong_answers)
            payload = {
                "question_type": question_type,
                "statement": statement,
                "correct_answers": [correct_answer],
                "wrong_answers": wrong_answers,
                "difficulty": Difficulty.MEDIUM,
                "score": 1.0,
                "penalty": 0.0,
            }
            questions.append(self._build_question(payload))

        if not questions:
            raise ParseError("TXT output did not contain parseable questions")
        return questions

    def _normalize_item(self, item: dict[str, Any]) -> dict[str, Any]:
        correct = item.get("correct_answers", item.get("correct_answer", item.get("answer", [])))
        wrong = item.get("wrong_answers", item.get("incorrect_answers", item.get("distractors", [])))
        question_type = item.get("question_type", item.get("type", QuestionType.MULTICHOICE.value))

        if isinstance(correct, str):
            correct = [correct]
        if isinstance(wrong, str):
            wrong = [wrong]

        image_id = item.get("image_id")
        return {
            "question_type": question_type,
            "statement": item.get("statement", item.get("question", item.get("prompt", ""))),
            "correct_answers": correct,
            "wrong_answers": wrong,
            "matching_pairs": item.get("matching_pairs", []),
            "image_id": image_id,
            "difficulty": item.get("difficulty", Difficulty.MEDIUM.value),
            "score": item.get("score", 1.0),
            "penalty": item.get("penalty", 0.0),
            "options": item.get("options", {}),
        }

    def _build_question(self, payload: dict[str, Any]) -> QuestionCreate:
        try:
            return QuestionCreate.model_validate(payload)
        except ValidationError as exc:
            raise ParseError(f"Invalid question payload: {exc.errors()}") from exc

    def _infer_txt_type(self, correct_answer: str, wrong_answers: list[str]) -> QuestionType:
        if correct_answer.lower() in {"true", "false", "verdadero", "falso"} and not wrong_answers:
            return QuestionType.TRUE_FALSE
        if wrong_answers:
            return QuestionType.MULTICHOICE
        return QuestionType.SHORT_ANSWER
