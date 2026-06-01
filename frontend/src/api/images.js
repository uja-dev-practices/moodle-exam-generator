import { api, API_URL, getToken } from "./client";

export async function uploadImage(templateId, file, caption, onProgress) {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);
  const { data } = await api.post(
    `/exam/templates/${templateId}/images`,
    form,
    {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );
  return data; // { image, message }
}

export async function listImages(templateId) {
  const { data } = await api.get(`/exam/templates/${templateId}/images`);
  return data;
}

export async function deleteImage(templateId, imageId) {
  await api.delete(`/exam/templates/${templateId}/images/${imageId}`);
}

/**
 * El contenido de imagen requiere Authorization, así que lo descargamos
 * como blob y devolvemos una object URL para usar en <img src>.
 */
export async function fetchImageBlobUrl(imageId) {
  const res = await api.get(`/exam/images/${imageId}/content`, {
    responseType: "blob",
  });
  return URL.createObjectURL(res.data);
}

export { API_URL, getToken };
