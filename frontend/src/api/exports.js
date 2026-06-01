import { api } from "./client";

const FORMATS = {
  xml: { path: "xml", ext: "xml", responseType: "text" },
  txt: { path: "txt", ext: "txt", responseType: "text" },
  json: { path: "json", ext: "json", responseType: "text" },
};

export async function fetchExport(templateId, format) {
  const cfg = FORMATS[format];
  const res = await api.get(`/exam/export/${cfg.path}/${templateId}`, {
    responseType: "text",
    transformResponse: (d) => d,
  });
  return res.data;
}

export function downloadString(content, filename, mime) {
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const EXPORT_FORMATS = FORMATS;
