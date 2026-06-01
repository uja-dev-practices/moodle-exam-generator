import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import AuthLayout from "../components/AuthLayout";
import { Field, Input } from "../components/ui/Field";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = "Introduce un email válido.";
    if (!form.password) e.password = "La contraseña es obligatoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success("Sesión iniciada correctamente.");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (idToken) => {
    try {
      await loginWithGoogle(idToken);
      toast.success("Sesión iniciada con Google.");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const { buttonRef, enabled: googleEnabled } = useGoogleSignIn(onGoogle);

  return (
    <AuthLayout>
      <h1>Bienvenido de nuevo</h1>
      <p className="auth-sub">Inicia sesión para gestionar tus exámenes.</p>

      <form onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={onChange}
            error={errors.email}
            autoComplete="email"
          />
        </Field>
        <Field label="Contraseña" error={errors.password} htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            autoComplete="current-password"
          />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="divider">o continúa con</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div ref={buttonRef} />
          </div>
        </>
      )}

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/registro">Crea una gratis</Link>
      </p>
    </AuthLayout>
  );
}
