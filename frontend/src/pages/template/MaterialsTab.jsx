import { useState } from "react";
import { uploadMaterial, deleteMaterial } from "../../api/materials";
import { useToast } from "../../context/ToastContext";
import FileDropzone from "../../components/FileDropzone";
import StorageBar from "../../components/StorageBar";
import Button from "../../components/ui/Button";
import { Badge, EmptyState } from "../../components/ui/Misc";
import { ConfirmDialog } from "../../components/ui/Modal";
import Spinner from "../../components/ui/Spinner";
import { MATERIAL_ACCEPT } from "../../utils/constants";
import { formatBytes, formatDate } from "../../utils/format";
import Icon from "../../components/ui/Icon";

const STATUS_BADGE = {
  processed: { variant: "success", label: "Procesado" },
  pending: { variant: "warn", label: "Pendiente" },
  failed: { variant: "danger", label: "Error de extracción" },
};

export default function MaterialsTab({
  templateId,
  materials,
  storage,
  reloadMaterials,
  reloadStorage,
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadMaterial(templateId, file, setProgress);
      await Promise.all([reloadMaterials(), reloadStorage()]);
      if (res.material?.status === "failed") {
        toast.info(
          "El archivo se subió pero no se pudo extraer texto. Aún cuenta para el contexto si lo reintentas con otro formato.",
          "Subido con avisos"
        );
      } else {
        toast.success("Material subido y procesado.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteMaterial(templateId, toDelete.id);
      await Promise.all([reloadMaterials(), reloadStorage()]);
      toast.success("Material eliminado.");
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 320px" }}>
      <div>
        <div className="card mb">
          <div className="card-body">
            {uploading ? (
              <div className="text-center" style={{ padding: 24 }}>
                <Spinner large />
                <p className="text-soft mt">Subiendo y procesando… {progress}%</p>
                <div className="progress mt">
                  <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <FileDropzone
                accept={MATERIAL_ACCEPT}
                icon="book"
                hint="PDF, DOCX, TXT, MD o imágenes (se extrae el texto, también por OCR)."
                onFile={handleUpload}
              />
            )}
          </div>
        </div>

        {materials.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="inbox"
              title="Sin material todavía"
              message="Sube documentos para que la IA genere preguntas basadas en su contenido."
            />
          </div>
        ) : (
          materials.map((m) => {
            const badge = STATUS_BADGE[m.status] || STATUS_BADGE.pending;
            return (
              <div key={m.id} className="list-item">
                <div className="list-item-icon icon-wrap icon-box">
                  <Icon name="file" size={20} />
                </div>
                <div className="list-item-main">
                  <div className="list-item-title">{m.original_filename}</div>
                  <div className="list-item-sub">
                    {formatBytes(m.size_bytes)} · {formatDate(m.created_at)}
                  </div>
                  {m.status === "failed" && m.error_message && (
                    <div className="field-error">{m.error_message}</div>
                  )}
                  {m.text_preview && (
                    <div
                      className="text-sm text-faint"
                      style={{
                        marginTop: 6,
                        maxHeight: 40,
                        overflow: "hidden",
                      }}
                    >
                      “{m.text_preview}”
                    </div>
                  )}
                </div>
                <div className="flex gap-sm items-center" style={{ flex: "none" }}>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() => setToDelete(m)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div>
        <div className="card mb">
          <div className="card-head">
            <h3>Espacio</h3>
          </div>
          <div className="card-body">
            <StorageBar storage={storage} />
          </div>
        </div>
        <div className="card">
          <div className="card-body text-sm text-soft">
            <strong>¿Para qué sirve?</strong>
            <p style={{ marginBottom: 0 }}>
              El texto de estos archivos se usa como contexto en el prompt de la
              IA. No se muestran en el examen; para imágenes visibles usa la
              pestaña <strong>Imágenes</strong>.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar material"
        message={`¿Eliminar "${toDelete?.original_filename}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
