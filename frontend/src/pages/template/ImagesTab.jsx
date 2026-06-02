import { useState } from "react";
import { uploadImage, deleteImage } from "../../api/images";
import { useToast } from "../../context/ToastContext";
import FileDropzone from "../../components/FileDropzone";
import AuthImage from "../../components/AuthImage";
import StorageBar from "../../components/StorageBar";
import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/Misc";
import { ConfirmDialog } from "../../components/ui/Modal";
import Modal from "../../components/ui/Modal";
import { Field, Input } from "../../components/ui/Field";
import { IMAGE_ACCEPT } from "../../utils/constants";
import { formatBytes } from "../../utils/format";

export default function ImagesTab({
  templateId,
  images,
  storage,
  reloadImages,
  reloadStorage,
}) {
  const toast = useToast();
  const [pendingFile, setPendingFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSelected = (file) => {
    setPendingFile(file);
    setCaption("");
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setProgress(0);
    try {
      await uploadImage(templateId, pendingFile, caption, setProgress);
      await Promise.all([reloadImages(), reloadStorage()]);
      toast.success("Imagen subida correctamente.");
      setPendingFile(null);
      setCaption("");
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
      await deleteImage(templateId, toDelete.id);
      await Promise.all([reloadImages(), reloadStorage()]);
      toast.success("Imagen eliminada.");
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid layout-split">
      <div>
        <div className="card mb">
          <div className="card-body">
            <h3 className="section-title">Subir imágenes del examen</h3>
            <p className="section-subtle mb">Añade recursos visuales para preguntas con soporte gráfico.</p>
            <FileDropzone
              accept={IMAGE_ACCEPT}
              icon="image"
              hint="PNG, JPG, WEBP o GIF. Se mostrarán dentro del examen (no se les extrae texto)."
              onFile={handleSelected}
            />
          </div>
        </div>

        {images.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="image"
              title="Sin imágenes"
              message="Sube imágenes para crear preguntas visuales y enlazarlas en la pestaña Preguntas."
            />
          </div>
        ) : (
          <div className="grid grid-cards">
            {images.map((img) => (
              <div key={img.id} className="card card-pad">
                <AuthImage imageId={img.id} alt={img.original_filename} />
                <div style={{ marginTop: 10 }}>
                  <div className="list-item-title">{img.original_filename}</div>
                  <div className="text-sm text-faint">
                    {formatBytes(img.size_bytes)}
                    {img.caption ? ` · ${img.caption}` : ""}
                  </div>
                </div>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  className="mt"
                  onClick={() => setToDelete(img)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
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
            <strong>Consejo</strong>
            <p style={{ marginBottom: 0 }}>
              Añade una descripción a cada imagen. La IA la usa para decidir a
              qué pregunta corresponde cada imagen al generar el examen.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de caption antes de subir */}
      <Modal
        open={!!pendingFile}
        onClose={() => !uploading && setPendingFile(null)}
        title="Subir imagen"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingFile(null)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} loading={uploading}>
              Subir imagen
            </Button>
          </>
        }
      >
        <p className="text-soft text-sm">
          Archivo: <strong>{pendingFile?.name}</strong> (
          {formatBytes(pendingFile?.size)})
        </p>
        <Field
          label="Descripción / pie de imagen (opcional)"
          hint="Ayuda a la IA a asociar la imagen con la pregunta correcta."
        >
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ej. Diagrama del ciclo del agua"
            maxLength={500}
          />
        </Field>
        {uploading && (
          <div className="progress mt">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar imagen"
        message={`¿Eliminar "${toDelete?.original_filename}"? Se desvinculará de cualquier pregunta que la use.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
