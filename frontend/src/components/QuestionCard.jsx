import AuthImage from "./AuthImage";
import { Badge } from "./ui/Misc";
import Icon from "./ui/Icon";
import {
  QUESTION_TYPE_LABEL,
  DIFFICULTY_LABEL,
} from "../utils/constants";

export default function QuestionCard({ question, index, footer }) {
  const diff = DIFFICULTY_LABEL[question.difficulty];
  return (
    <div className="card card-pad mb">
      <div className="flex justify-between items-center mb wrap gap-sm">
        <div className="flex gap-sm items-center wrap">
          <Badge variant="primary">#{index}</Badge>
          <Badge>{QUESTION_TYPE_LABEL[question.question_type] || question.question_type}</Badge>
          {diff && <Badge variant={diff.badge.replace("badge-", "")}>{diff.label}</Badge>}
          <span className="text-sm text-faint">
            {question.score} pt{question.penalty ? ` · -${question.penalty}` : ""}
          </span>
        </div>
        {question.image_id && (
          <Badge variant="info">
            <Icon name="image" size={12} className="icon-inline" />
            Con imagen
          </Badge>
        )}
      </div>

      <p style={{ fontWeight: 600, marginTop: 0 }}>{question.statement}</p>

      {question.image_id && (
        <div style={{ maxWidth: 320, margin: "10px 0" }}>
          <AuthImage imageId={question.image_id} alt="Imagen de la pregunta" />
        </div>
      )}

      {question.question_type === "matching" ? (
        <div className="grid grid-2">
          {(question.matching_pairs || []).map((p, i) => (
            <div key={i} className="text-sm" style={{ display: "flex", gap: 8 }}>
              <span>{p.prompt}</span>
              <span className="text-faint">↔</span>
              <strong>{p.answer}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex" style={{ flexDirection: "column", gap: 6 }}>
          {(question.correct_answers || []).map((a, i) => (
            <div key={`c${i}`} className="text-sm icon-wrap" style={{ color: "var(--c-success)" }}>
              <Icon name="check" size={14} className="icon-inline icon-success" />
              {a}
            </div>
          ))}
          {(question.wrong_answers || []).map((a, i) => (
            <div key={`w${i}`} className="text-sm text-soft icon-wrap">
              <Icon name="x" size={14} className="icon-inline icon-muted" />
              {a}
            </div>
          ))}
        </div>
      )}

      {footer && <div className="mt">{footer}</div>}
    </div>
  );
}
