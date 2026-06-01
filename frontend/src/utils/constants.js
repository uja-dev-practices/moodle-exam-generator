export const QUESTION_TYPES = [
  { value: "multichoice", label: "Opción múltiple", icon: "listChecks" },
  { value: "truefalse", label: "Verdadero / Falso", icon: "toggle" },
  { value: "shortanswer", label: "Respuesta corta", icon: "pencil" },
  { value: "matching", label: "Emparejamiento", icon: "link" },
];

export const QUESTION_TYPE_LABEL = QUESTION_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

export const DIFFICULTIES = [
  { value: "easy", label: "Fácil", badge: "badge-success" },
  { value: "medium", label: "Media", badge: "badge-info" },
  { value: "hard", label: "Difícil", badge: "badge-warn" },
  { value: "very_hard", label: "Muy difícil", badge: "badge-danger" },
];

export const DIFFICULTY_LABEL = DIFFICULTIES.reduce((acc, d) => {
  acc[d.value] = d;
  return acc;
}, {});

export const MATERIAL_ACCEPT = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp";
export const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif";
