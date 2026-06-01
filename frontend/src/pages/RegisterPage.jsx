import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import AuthLayout from "../components/AuthLayout";
import { Field, Input } from "../components/ui/Field";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = "Introduce un email válido.";
    if (form.password.length < 8)
      e.password = "La contraseña debe tener al menos 8 caracteres.";
    if (form.password !== form.confirm)
      e.confirm = "Las contraseñas no coinciden.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      });
      toast.success("Cuenta creada. ¡Bienvenido!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async (idToken) => {
    try {
      await loginWithGoogle(idToken);
      toast.success("Cuenta vinculada con Google.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const { buttonRef, enabled: googleEnabled } = useGoogleSignIn(onGoogle);

  return (
    <AuthLayout>
      <h1>Crea tu cuenta</h1>
      <p className="auth-sub">Empieza a generar exámenes en segundos.</p>

      <form onSubmit={submit} noValidate>
        <Field label="Nombre (opcional)" htmlFor="full_name">
          <Input
            id="full_name"
            name="full_name"
            placeholder="Tu nombre"
            value={form.full_name}
            onChange={onChange}
            autoComplete="name"
          />
        </Field>
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
        <Field
          label="Contraseña"
          error={errors.password}
          hint="Mínimo 8 caracteres."
          htmlFor="password"
        >
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Repite la contraseña" error={errors.confirm} htmlFor="confirm">
          <Input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={onChange}
            error={errors.confirm}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="divider">o regístrate con</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div ref={buttonRef} />
          </div>
        </>
      )}

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}
