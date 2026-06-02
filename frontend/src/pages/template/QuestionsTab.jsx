import { useState } from "react";
import { attachImageToQuestion } from "../../api/questions";
import { useToast } from "../../context/ToastContext";
import QuestionCard from "../../components/QuestionCard";
import AuthImage from "../../components/AuthImage";
import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Misc";
import Modal from "../../components/ui/Modal";
import Icon from "../../components/ui/Icon";

export default function QuestionsTab({
  questions,
  images,
  reloadQuestions,
  goToTab,
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const setImage = async (questionId, imageId) => {
    setSaving(true);
    try {
      await attachImageToQuestion(questionId, imageId);
      await reloadQuestions();
      toast.success(imageId ? "Imagen vinculada." : "Imagen desvinculada.");
      setEditing(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="help"
          title="Aún no hay preguntas"
          message="Genera o importa preguntas desde la pestaña Generar."
          action={
            <Button onClick={() => goToTab("generate")}>
              <Icon name="sparkles" size={16} className="icon-inline" />
              Generar preguntas
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb wrap gap-sm">
        <p className="text-soft page-lead" style={{ margin: 0 }}>
          {questions.length} preguntas guardadas. Vincula imágenes a las
          preguntas que las necesiten.
        </p>
        <Button variant="subtle" size="sm" onClick={() => goToTab("export")}>
          Exportar examen →
        </Button>
      </div>

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i + 1}
          footer={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(q)}
              disabled={images.length === 0}
            >
              {q.image_id ? "Cambiar imagen" : "Vincular imagen"}
            </Button>
          }
        />
      ))}

      {images.length === 0 && (
        <p className="text-sm text-faint text-center">
          Sube imágenes en la pestaña <strong>Imágenes</strong> para poder
          vincularlas a las preguntas.
        </p>
      )}

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title="Vincular imagen a la pregunta"
        large
      >
        <p className="text-soft text-sm">{editing?.statement}</p>
        <div className="grid grid-cards mt">
          <button
            className="card card-pad"
            style={{
              cursor: "pointer",
              textAlign: "center",
              border: editing?.image_id
                ? "1px solid var(--c-border)"
                : "2px solid var(--c-primary)",
              background: "none",
            }}
            disabled={saving}
            onClick={() => setImage(editing.id, null)}
          >
            <div className="icon-wrap icon-box" style={{ margin: "0 auto 8px" }}>
              <Icon name="ban" size={24} className="icon-muted" />
            </div>
            Sin imagen
          </button>
          {images.map((img) => {
            const selected = editing?.image_id === img.id;
            return (
              <button
                key={img.id}
                className="card card-pad"
                style={{
                  cursor: "pointer",
                  border: selected
                    ? "2px solid var(--c-primary)"
                    : "1px solid var(--c-border)",
                  background: "none",
                }}
                disabled={saving}
                onClick={() => setImage(editing.id, img.id)}
              >
                <AuthImage imageId={img.id} alt={img.original_filename} />
                <div className="text-sm" style={{ marginTop: 8 }}>
                  {img.caption || img.original_filename}
                </div>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
