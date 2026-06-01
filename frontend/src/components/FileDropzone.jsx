import { useRef, useState } from "react";
import Icon from "./ui/Icon";

export default function FileDropzone({ accept, onFile, hint, icon = "paperclip" }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (files) => {
    if (files && files.length) onFile(files[0]);
  };

  return (
    <div
      className="card"
      style={{
        borderStyle: "dashed",
        borderColor: drag ? "var(--c-primary)" : "var(--c-border-strong)",
        background: drag ? "var(--c-primary-soft)" : "var(--c-surface)",
        padding: "30px 22px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="icon-wrap icon-box icon-box-lg" style={{ margin: "0 auto 12px" }}>
        <Icon name={icon} size={26} className="icon-primary" />
      </div>
      <div style={{ fontWeight: 600 }}>
        Arrastra un archivo o haz clic para seleccionar
      </div>
      {hint && <div className="field-hint">{hint}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
