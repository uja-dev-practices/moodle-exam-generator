import { api } from "./client";

export async function buildPrompt(templateId, { topic_prompt, material_ids }) {
  const { data } = await api.post(`/exam/prompts/${templateId}`, {
    topic_prompt,
    material_ids: material_ids?.length ? material_ids : null,
  });
  return data; // { template_id, prompt, expected_format }
}

export async function generateExam({ template_id, topic_prompt, material_ids }) {
  const { data } = await api.post("/exam/generate", {
    template_id,
    topic_prompt,
    material_ids: material_ids?.length ? material_ids : null,
  });
  return data; // { questions: [...] }
}

export async function parseOutput({ template_id, raw_output, input_format }) {
  const { data } = await api.post("/exam/parse", {
    template_id,
    raw_output,
    input_format,
  });
  return data; // { questions: [...] }
}
