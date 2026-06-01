import { Badge } from "../../components/ui/Misc";
import Button from "../../components/ui/Button";
import StorageBar from "../../components/StorageBar";
import {
  QUESTION_TYPE_LABEL,
  DIFFICULTY_LABEL,
} from "../../utils/constants";
import { formatDate } from "../../utils/format";
import Icon from "../../components/ui/Icon";

export default function OverviewTab({ template, storage, goToTab }) {
  const qTypes = template.settings?.question_types || [];
  const profile = template.difficulty_profile || {};

  return (
    <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <div>
        <div className="card mb">
          <div className="card-head">
            <h3>Estructura del examen</h3>
          </div>
          <div className="card-body">
            <h4 className="text-soft text-sm">Tipos de pregunta</h4>
            {qTypes.map((qt, i) => (
              <div
                key={i}
                className="flex justify-between items-center"
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < qTypes.length - 1 ? "1px solid var(--c-border)" : "none",
                }}
              >
                <div>
                  <strong>{QUESTION_TYPE_LABEL[qt.type] || qt.type}</strong>
                  {qt.type === "multichoice" && qt.options_count && (
                    <span className="text-faint text-sm">
                      {" "}· {qt.options_count} opciones
                      {qt.multiple_correct ? " · multi-respuesta" : ""}
                    </span>
                  )}
                </div>
                <div className="flex gap-sm items-center">
                  <Badge variant="primary">{qt.count} preg.</Badge>
                  <span className="text-sm text-faint">
                    {qt.score} pt{qt.penalty ? ` · -${qt.penalty}` : ""}
                  </span>
                </div>
              </div>
            ))}

            <div className="divider-line" />
            <h4 className="text-soft text-sm">Reparto por dificultad</h4>
            <div className="flex gap-sm wrap">
              {Object.entries(profile).map(([key, val]) =>
                val > 0 ? (
                  <Badge key={key} variant={DIFFICULTY_LABEL[key]?.badge?.replace("badge-", "")}>
                    {DIFFICULTY_LABEL[key]?.label || key}: {val}
                  </Badge>
                ) : null
              )}
            </div>

            <div className="divider-line" />
            <div className="flex gap-sm wrap text-sm">
              <Badge variant={template.settings?.shuffle_questions ? "success" : undefined}>
                <Icon
                  name={template.settings?.shuffle_questions ? "check" : "x"}
                  size={12}
                  className="icon-inline"
                />
                Barajar preguntas
              </Badge>
              <Badge variant={template.settings?.shuffle_answers ? "success" : undefined}>
                <Icon
                  name={template.settings?.shuffle_answers ? "check" : "x"}
                  size={12}
                  className="icon-inline"
                />
                Barajar respuestas
              </Badge>
              <Badge variant={template.settings?.include_feedback ? "success" : undefined}>
                <Icon
                  name={template.settings?.include_feedback ? "check" : "x"}
                  size={12}
                  className="icon-inline"
                />
                Feedback
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card mb">
          <div className="card-head">
            <h3>Almacenamiento</h3>
          </div>
          <div className="card-body">
            <StorageBar storage={storage} />
          </div>
        </div>

        <div className="card mb">
          <div className="card-head">
            <h3>Siguiente paso</h3>
          </div>
          <div className="card-body flex" style={{ flexDirection: "column", gap: 10 }}>
            <Button variant="subtle" block onClick={() => goToTab("materials")}>
              <Icon name="book" size={16} className="icon-inline" />
              Subir material para la IA
            </Button>
            <Button variant="subtle" block onClick={() => goToTab("images")}>
              <Icon name="image" size={16} className="icon-inline" />
              Añadir imágenes
            </Button>
            <Button block onClick={() => goToTab("generate")}>
              <Icon name="sparkles" size={16} className="icon-inline" />
              Generar preguntas
            </Button>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-sm text-faint">
            Creado el {formatDate(template.created_at)}
            <br />
            Actualizado el {formatDate(template.updated_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
