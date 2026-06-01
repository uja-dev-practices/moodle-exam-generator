import { api } from "./client";

export async function uploadMaterial(templateId, file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(
    `/exam/templates/${templateId}/materials`,
    form,
    {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );
  return data; // { material, message }
}

export async function listMaterials(templateId) {
  const { data } = await api.get(`/exam/templates/${templateId}/materials`);
  return data;
}

export async function deleteMaterial(templateId, materialId) {
  await api.delete(`/exam/templates/${templateId}/materials/${materialId}`);
}
