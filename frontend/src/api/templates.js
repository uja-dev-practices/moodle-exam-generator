import { api } from "./client";

export async function createTemplate(payload) {
  const { data } = await api.post("/exam/templates", payload);
  return data;
}

export async function listTemplates() {
  const { data } = await api.get("/exam/templates");
  return data;
}

export async function getTemplate(templateId) {
  const { data } = await api.get(`/exam/templates/${templateId}`);
  return data;
}

export async function listQuestions(templateId) {
  const { data } = await api.get(`/exam/templates/${templateId}/questions`);
  return data;
}

export async function getTemplateStorage(templateId) {
  const { data } = await api.get(`/exam/templates/${templateId}/storage`);
  return data;
}
