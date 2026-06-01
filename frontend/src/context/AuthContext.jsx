import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  clearToken,
  getToken,
  onUnauthorized,
  setToken,
} from "../api/client";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Carga inicial: si hay token, intenta recuperar el usuario.
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        if (active) setUser(me);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  // Reacciona a 401 global (token caducado).
  useEffect(() => onUnauthorized(() => logout()), [logout]);

  const finishLogin = useCallback(async (tokenResponse) => {
    setToken(tokenResponse.access_token);
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      return finishLogin(res);
    },
    [finishLogin]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const res = await authApi.loginWithGoogle(idToken);
      return finishLogin(res);
    },
    [finishLogin]
  );

  const register = useCallback(async (payload) => {
    await authApi.register(payload);
    // Tras registrar, iniciamos sesión automáticamente.
    const res = await authApi.login({
      email: payload.email,
      password: payload.password,
    });
    setToken(res.access_token);
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
