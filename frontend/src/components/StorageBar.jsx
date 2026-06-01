import { formatBytes } from "../utils/format";
import Icon from "./ui/Icon";

export default function StorageBar({ storage }) {
  if (!storage) return null;
  const pct = storage.limit_bytes
    ? Math.min(100, Math.round((storage.used_bytes / storage.limit_bytes) * 100))
    : 0;
  const level = pct >= 90 ? "danger" : pct >= 70 ? "warn" : "";

  return (
    <div>
      <div className="flex justify-between text-sm mb" style={{ marginBottom: 6 }}>
        <span className="text-soft">
          Almacenamiento del examen ({formatBytes(storage.used_bytes)} /{" "}
          {formatBytes(storage.limit_bytes)})
        </span>
        <strong>{pct}%</strong>
      </div>
      <div className="progress">
        <div className={`progress-bar ${level}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap text-sm text-faint" style={{ marginTop: 8 }}>
        <span className="icon-wrap">
          <Icon name="book" size={14} className="icon-inline" />
          Materiales: {formatBytes(storage.materials_bytes)}
        </span>
        <span className="icon-wrap">
          <Icon name="image" size={14} className="icon-inline" />
          Imágenes: {formatBytes(storage.images_bytes)}
        </span>
        <span>Disponible: {formatBytes(storage.remaining_bytes)}</span>
      </div>
    </div>
  );
}
