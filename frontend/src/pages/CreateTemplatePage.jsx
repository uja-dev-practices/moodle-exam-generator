import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTemplate } from "../api/templates";
import { useToast } from "../context/ToastContext";
import { Field, Input, Select, Checkbox } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { Badge } from "../components/ui/Misc";
import { QUESTION_TYPES, DIFFICULTIES } from "../utils/constants";
import { totalQuestionsFromProfile } from "../utils/format";

const emptyType = () => ({
  type: "multichoice",
  count: 5,
  options_count: 4,
  multiple_correct: false,
  score: 1,
  penalty: 0,
});

export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: "",
    subject: "",
    educational_level: "",
    language: "es",
  });
  const [types, setTypes] = useState([emptyType()]);
  const [settings, setSettings] = useState({
    shuffle_questions: true,
    shuffle_answers: true,
    include_feedback: true,
  });
  const [difficulty, setDifficulty] = useState({
    easy: 2,
    medium: 3,
    hard: 0,
    very_hard: 0,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const totalDifficulty = useMemo(
    () => totalQuestionsFromProfile(difficulty),
    [difficulty]
  );

  const onField = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const updateType = (idx, patch) =>
    setTypes((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const addType = () => setTypes((prev) => [...prev, emptyType()]);
  const removeType = (idx) =>
    setTypes((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = "Mínimo 3 caracteres.";
    if (form.subject.trim().length < 2) e.subject = "Mínimo 2 caracteres.";
    if (form.educational_level.trim().length < 2)
      e.educational_level = "Mínimo 2 caracteres.";
    if (types.length === 0) e.types = "Añade al menos un tipo de pregunta.";
    if (totalDifficulty <= 0)
      e.difficulty = "Reparte al menos una pregunta entre las dificultades.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Revisa los campos marcados.");
      return;
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      subject: form.subject.trim(),
      educational_level: form.educational_level.trim(),
      settings: {
        question_types: types.map((t) => ({
          type: t.type,
          count: Number(t.count),
          options_count:
            t.type === "multichoice" ? Number(t.options_count) : null,
          multiple_correct:
            t.type === "multichoice" ? t.multiple_correct : false,
          score: Number(t.score),
          penalty: Number(t.penalty),
        })),
        ...settings,
      },
      difficulty_profile: {
        easy: Number(difficulty.easy) || 0,
        medium: Number(difficulty.medium) || 0,
        hard: Number(difficulty.hard) || 0,
        very_hard: Number(difficulty.very_hard) || 0,
      },
    };

    setSaving(true);
    try {
      const created = await createTemplate(payload);
      toast.success("Plantilla creada correctamente.");
      navigate(`/plantillas/${created.id}`);
    } catch (err) {
      toast.error(err.message);
      if (err.details) {
        console.warn("Detalles de validación:", err.details);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>Nuevo examen</h1>
          <p className="page-lead">Define la estructura. Después podrás subir material y generar preguntas.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        {/* Datos generales */}
        <div className="card mb">
          <div className="card-head">
            <h3>1 · Información general</h3>
          </div>
          <div className="card-body">
            <Field label="Título del examen" error={errors.title}>
              <Input
                name="title"
                value={form.title}
                onChange={onField}
                placeholder="Ej. Examen Tema 3 — Sistemas Operativos"
                error={errors.title}
              />
            </Field>
            <div className="row">
              <Field label="Asignatura" error={errors.subject}>
                <Input
                  name="subject"
                  value={form.subject}
                  onChange={onField}
                  placeholder="Ej. Sistemas Operativos"
                  error={errors.subject}
                />
              </Field>
              <Field label="Nivel educativo" error={errors.educational_level}>
                <Input
                  name="educational_level"
                  value={form.educational_level}
                  onChange={onField}
                  placeholder="Ej. Ciclo Superior DAM"
                  error={errors.educational_level}
                />
              </Field>
            </div>
            <Field label="Idioma">
              <Select name="language" value={form.language} onChange={onField}>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="fr">Francés</option>
                <option value="de">Alemán</option>
                <option value="it">Italiano</option>
                <option value="pt">Portugués</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Tipos de pregunta */}
        <div className="card mb">
          <div className="card-head">
            <h3>2 · Tipos de pregunta</h3>
            <span style={{ flex: 1 }} />
            <Button type="button" variant="subtle" size="sm" onClick={addType}>
              + Añadir tipo
            </Button>
          </div>
          <div className="card-body">
            {errors.types && <div className="field-error mb">{errors.types}</div>}
            {types.map((t, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: 16, marginBottom: 14, background: "var(--c-surface-2)" }}
              >
                <div className="flex justify-between items-center mb wrap gap-sm">
                  <strong>Bloque {idx + 1}</strong>
                  {types.length > 1 && (
                    <Button
                      type="button"
                      variant="danger-ghost"
                      size="sm"
                      onClick={() => removeType(idx)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="row">
                  <Field label="Tipo">
                    <Select
                      value={t.type}
                      onChange={(e) => updateType(idx, { type: e.target.value })}
                    >
                      {QUESTION_TYPES.map((q) => (
                        <option key={q.value} value={q.value}>
                          {q.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Nº preguntas">
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={t.count}
                      onChange={(e) => updateType(idx, { count: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="row">
                  <Field label="Puntuación">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={t.score}
                      onChange={(e) => updateType(idx, { score: e.target.value })}
                    />
                  </Field>
                  <Field label="Penalización">
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={t.penalty}
                      onChange={(e) =>
                        updateType(idx, { penalty: e.target.value })
                      }
                    />
                  </Field>
                </div>
                {t.type === "multichoice" && (
                  <div className="row items-center">
                    <Field label="Nº de opciones">
                      <Input
                        type="number"
                        min={2}
                        max={8}
                        value={t.options_count}
                        onChange={(e) =>
                          updateType(idx, { options_count: e.target.value })
                        }
                      />
                    </Field>
                    <div style={{ paddingTop: 8 }}>
                      <Checkbox
                        label="Permitir varias respuestas correctas"
                        checked={t.multiple_correct}
                        onChange={(e) =>
                          updateType(idx, { multiple_correct: e.target.checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Perfil de dificultad */}
        <div className="card mb">
          <div className="card-head">
            <h3>3 · Reparto por dificultad</h3>
            <span style={{ flex: 1 }} />
            <Badge variant={totalDifficulty > 0 ? "primary" : "danger"}>
              {totalDifficulty} preguntas
            </Badge>
          </div>
          <div className="card-body">
            {errors.difficulty && (
              <div className="field-error mb">{errors.difficulty}</div>
            )}
            <div className="grid grid-2">
              {DIFFICULTIES.map((d) => (
                <Field key={d.value} label={d.label}>
                  <Input
                    type="number"
                    min={0}
                    value={difficulty[d.value]}
                    onChange={(e) =>
                      setDifficulty((p) => ({ ...p, [d.value]: e.target.value }))
                    }
                  />
                </Field>
              ))}
            </div>
            <p className="field-hint">
              Indica cuántas preguntas quieres de cada nivel. La IA intentará
              respetar este reparto.
            </p>
          </div>
        </div>

        {/* Opciones */}
        <div className="card mb">
          <div className="card-head">
            <h3>4 · Opciones del examen</h3>
          </div>
          <div className="card-body flex" style={{ flexDirection: "column", gap: 14 }}>
            <Checkbox
              label="Barajar el orden de las preguntas"
              checked={settings.shuffle_questions}
              onChange={(e) =>
                setSettings((s) => ({ ...s, shuffle_questions: e.target.checked }))
              }
            />
            <Checkbox
              label="Barajar el orden de las respuestas"
              checked={settings.shuffle_answers}
              onChange={(e) =>
                setSettings((s) => ({ ...s, shuffle_answers: e.target.checked }))
              }
            />
            <Checkbox
              label="Incluir retroalimentación (feedback) en las preguntas"
              checked={settings.include_feedback}
              onChange={(e) =>
                setSettings((s) => ({ ...s, include_feedback: e.target.checked }))
              }
            />
          </div>
        </div>

        <div className="flex gap justify-between wrap mobile-stack mt">
          <Button type="button" variant="ghost" onClick={() => navigate("/")}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" loading={saving}>
            Crear examen
          </Button>
        </div>
      </form>
    </div>
  );
}
