import { api } from "./client";

export async function register({ email, password, full_name }) {
  const { data } = await api.post("/auth/register", {
    email,
    password,
    full_name: full_name || null,
  });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { access_token, token_type }
}

export async function loginWithGoogle(idToken) {
  const { data } = await api.post("/auth/google", { id_token: idToken });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data; // { id, email, full_name, created_at }
}
