import Icon from "./ui/Icon";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <div className="brand" style={{ color: "#fff" }}>
          <span className="brand-logo" style={{ background: "rgba(255,255,255,.18)" }}>
            <Icon name="document" size={18} />
          </span>
          GenExámenes IA
        </div>
        <div>
          <h2>Crea exámenes con IA y expórtalos a Moodle en minutos.</h2>
          <p style={{ marginBottom: 32 }}>
            Define la plantilla, sube tu material de estudio y deja que la IA
            redacte las preguntas por ti.
          </p>
          <Feature icon="cpu" title="Generación con IA">
            Preguntas tipo test, V/F, respuesta corta y emparejamiento.
          </Feature>
          <Feature icon="book" title="Material de contexto">
            Sube PDF, DOCX, TXT o imágenes y la IA usará su contenido.
          </Feature>
          <Feature icon="moodle" title="Exportación Moodle">
            Descarga el examen en XML compatible con Moodle, TXT o JSON.
          </Feature>
        </div>
        <p className="text-sm" style={{ opacity: 0.7, margin: 0 }}>
          © {new Date().getFullYear()} GenExámenes IA
        </p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="auth-feature">
      <div className="auth-feature-icon">
        <Icon name={icon} size={18} />
      </div>
      <div>
        <strong>{title}</strong>
        <div style={{ color: "rgba(255,255,255,.78)", fontSize: 13.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
