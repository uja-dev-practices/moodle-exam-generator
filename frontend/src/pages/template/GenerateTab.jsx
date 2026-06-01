import { useState } from "react";
import { buildPrompt, generateExam, parseOutput } from "../../api/generation";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";
import { Field, Textarea, Select, Checkbox } from "../../components/ui/Field";
import { Badge, EmptyState } from "../../components/ui/Misc";
import QuestionCard from "../../components/QuestionCard";
import { totalQuestionsFromProfile } from "../../utils/format";
import Icon from "../../components/ui/Icon";

const MODES = [
  { id: "auto", label: "Generación automática", icon: "sparkles" },
  { id: "prompt", label: "Solo prompt", icon: "document" },
  { id: "parse", label: "Pegar respuesta IA", icon: "download" },
];

export default function GenerateTab({
  templateId,
  template,
  materials,
  reloadQuestions,
  reloadTemplate,
  goToTab,
}) {
  const toast = useToast();
  const [mode, setMode] = useState("auto");
  const [topic, setTopic] = useState("");
  const [useAllMaterials, setUseAllMaterials] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [rawOutput, setRawOutput] = useState("");
  const [inputFormat, setInputFormat] = useState("json");
  const [generated, setGenerated] = useState([]);

  const processedMaterials = materials.filter((m) => m.status === "processed");
  const expectedTotal = totalQuestionsFromProfile(template.difficulty_profile);

  const materialIds = useAllMaterials ? null : selectedMaterials;

  const toggleMaterial = (id) =>
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const onBuildPrompt = async () => {
    setLoading(true);
    try {
      const res = await buildPrompt(templateId, {
        topic_prompt: topic,
        material_ids: materialIds,
      });
      setPrompt(res.prompt);
      toast.success("Prompt generado. Cópialo en tu LLM preferido.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateExam({
        template_id: templateId,
        topic_prompt: topic,
        material_ids: materialIds,
      });
      setGenerated(res.questions || []);
      await Promise.all([reloadQuestions(), reloadTemplate()]);
      toast.success(`Se generaron ${res.questions?.length || 0} preguntas.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onParse = async () => {
    setLoading(true);
    try {
      const res = await parseOutput({
        template_id: templateId,
        raw_output: rawOutput,
        input_format: inputFormat,
      });
      setGenerated(res.questions || []);
      await Promise.all([reloadQuestions(), reloadTemplate()]);
      toast.success(`Se importaron ${res.questions?.length || 0} preguntas.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard?.writeText(prompt);
    toast.info("Prompt copiado al portapapeles.");
  };

  const topicTooShort = topic.trim().length < 5;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 340px" }}>
      <div>
        <div className="tabs" style={{ marginBottom: 18 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`tab ${mode === m.id ? "active" : ""}`}
              onClick={() => setMode(m.id)}
            >
              <Icon name={m.icon} size={16} />
              {m.label}
            </button>
          ))}
        </div>

        {mode !== "parse" && (
          <div className="card mb">
            <div className="card-body">
              <Field
                label="Tema / instrucciones para la IA"
                hint="Describe el contenido o enfoque del examen (mínimo 5 caracteres)."
                error={topicTooShort && topic.length > 0 ? "Escribe al menos 5 caracteres." : null}
              >
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej. Genera preguntas sobre la gestión de procesos y planificación de CPU del Tema 3."
                  maxLength={4000}
                />
              </Field>

              {processedMaterials.length > 0 && (
                <Field label="Material de contexto">
                  <Checkbox
                    label={`Usar todo el material procesado (${processedMaterials.length})`}
                    checked={useAllMaterials}
                    onChange={(e) => setUseAllMaterials(e.target.checked)}
                  />
                  {!useAllMaterials && (
                    <div className="mt flex" style={{ flexDirection: "column", gap: 8 }}>
                      {processedMaterials.map((m) => (
                        <Checkbox
                          key={m.id}
                          label={m.original_filename}
                          checked={selectedMaterials.includes(m.id)}
                          onChange={() => toggleMaterial(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              )}

              <div className="flex gap mt">
                {mode === "auto" ? (
                  <Button
                    size="lg"
                    onClick={onGenerate}
                    loading={loading}
                    disabled={topicTooShort}
                  >
                    <Icon name="sparkles" size={16} className="icon-inline" />
                    Generar preguntas
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={onBuildPrompt}
                    loading={loading}
                    disabled={topicTooShort}
                  >
                    <Icon name="document" size={16} className="icon-inline" />
                    Construir prompt
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === "prompt" && prompt && (
          <div className="card mb">
            <div className="card-head">
              <h3>Prompt generado</h3>
              <span style={{ flex: 1 }} />
              <Button size="sm" variant="subtle" onClick={copyPrompt}>
                Copiar
              </Button>
            </div>
            <div className="card-body">
              <div className="code-block">{prompt}</div>
              <p className="field-hint">
                Pega este prompt en tu LLM, copia su respuesta JSON y vuelve con
                el modo <strong>“Pegar respuesta IA”</strong> para importar las
                preguntas.
              </p>
            </div>
          </div>
        )}

        {mode === "parse" && (
          <div className="card mb">
            <div className="card-body">
              <Field label="Formato de entrada">
                <Select
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                >
                  <option value="json">JSON (recomendado)</option>
                  <option value="txt">Texto plano</option>
                </Select>
              </Field>
              <Field
                label="Respuesta de la IA"
                hint="Pega aquí la salida del LLM."
              >
                <Textarea
                  mono
                  value={rawOutput}
                  onChange={(e) => setRawOutput(e.target.value)}
                  placeholder='{ "questions": [ ... ] }'
                  style={{ minHeight: 220 }}
                  maxLength={200000}
                />
              </Field>
              <Button
                size="lg"
                onClick={onParse}
                loading={loading}
                disabled={rawOutput.trim().length < 5}
              >
                <Icon name="download" size={16} className="icon-inline" />
                Importar preguntas
              </Button>
            </div>
          </div>
        )}

        {generated.length > 0 && (
          <div className="mt-lg">
            <div className="flex justify-between items-center mb">
              <h3 style={{ margin: 0 }}>
                Resultado ({generated.length} preguntas)
              </h3>
              <Button variant="subtle" size="sm" onClick={() => goToTab("questions")}>
                Ver todas las preguntas →
              </Button>
            </div>
            {generated.map((q, i) => (
              <QuestionCard key={q.id || i} question={q} index={i + 1} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="card mb">
          <div className="card-head">
            <h3>Resumen del objetivo</h3>
          </div>
          <div className="card-body flex" style={{ flexDirection: "column", gap: 10 }}>
            <div className="flex justify-between">
              <span className="text-soft">Preguntas objetivo</span>
              <Badge variant="primary">{expectedTotal}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-soft">Material procesado</span>
              <Badge variant={processedMaterials.length ? "success" : undefined}>
                {processedMaterials.length}
              </Badge>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-sm text-soft">
            <strong>¿Cómo funciona?</strong>
            <ul style={{ paddingLeft: 18, margin: "8px 0 0" }}>
              <li>
                <strong>Automática:</strong> el backend llama al LLM y guarda las
                preguntas.
              </li>
              <li>
                <strong>Solo prompt:</strong> obtienes el prompt para usarlo en
                otro LLM.
              </li>
              <li>
                <strong>Pegar respuesta:</strong> importas la salida JSON/TXT de
                la IA.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
