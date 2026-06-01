import { useState } from "react";
import { fetchExport, downloadString } from "../../api/exports";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Misc";
import Icon from "../../components/ui/Icon";

const FORMATS = [
  {
    id: "xml",
    title: "Moodle XML",
    icon: "moodle",
    desc: "Importable directamente en un banco de preguntas de Moodle. Incluye imágenes embebidas.",
    mime: "application/xml",
  },
  {
    id: "txt",
    title: "Texto plano",
    icon: "file",
    desc: "Listado simple de enunciados y respuestas para revisión rápida.",
    mime: "text/plain",
  },
  {
    id: "json",
    title: "JSON",
    icon: "document",
    desc: "Estructura completa de las preguntas para integraciones o copias de seguridad.",
    mime: "application/json",
  },
];

export default function ExportTab({ templateId, template, questions }) {
  const toast = useToast();
  const [loadingFormat, setLoadingFormat] = useState(null);
  const [preview, setPreview] = useState(null);

  const slug = (template.title || "examen")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const run = async (fmt, { download }) => {
    setLoadingFormat(fmt.id);
    try {
      const content = await fetchExport(templateId, fmt.id);
      if (download) {
        downloadString(content, `${slug}.${fmt.id}`, fmt.mime);
        toast.success(`Examen exportado como ${fmt.title}.`);
      } else {
        setPreview({ fmt, content });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingFormat(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="upload"
          title="Nada que exportar todavía"
          message="Genera preguntas antes de exportar el examen."
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-soft mb">
        Tu examen tiene <strong>{questions.length} preguntas</strong>. Elige un
        formato para descargarlo o previsualizarlo.
      </p>
      <div className="grid grid-cards">
        {FORMATS.map((fmt) => (
          <div key={fmt.id} className="card card-pad">
            <div className="icon-wrap icon-box icon-box-lg" style={{ marginBottom: 8 }}>
              <Icon name={fmt.icon} size={28} className="icon-primary" />
            </div>
            <h3 style={{ margin: "8px 0 4px" }}>{fmt.title}</h3>
            <p className="text-sm text-soft" style={{ minHeight: 60 }}>
              {fmt.desc}
            </p>
            <div className="flex gap-sm">
              <Button
                onClick={() => run(fmt, { download: true })}
                loading={loadingFormat === fmt.id}
              >
                Descargar
              </Button>
              <Button
                variant="ghost"
                onClick={() => run(fmt, { download: false })}
                disabled={loadingFormat === fmt.id}
              >
                Previsualizar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="card mt-lg">
          <div className="card-head">
            <h3>Vista previa · {preview.fmt.title}</h3>
            <span style={{ flex: 1 }} />
            <Button
              size="sm"
              variant="subtle"
              onClick={() =>
                downloadString(
                  preview.content,
                  `${slug}.${preview.fmt.id}`,
                  preview.fmt.mime
                )
              }
            >
              Descargar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Cerrar
            </Button>
          </div>
          <div className="card-body">
            <div className="code-block">{preview.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
