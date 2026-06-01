import { api } from "./client";

export async function attachImageToQuestion(questionId, imageId) {
  const { data } = await api.patch(`/exam/questions/${questionId}/image`, {
    image_id: imageId,
  });
  return data; // QuestionRead
}
