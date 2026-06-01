export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <div className="field-error">{error}</div>
      ) : hint ? (
        <div className="field-hint">{hint}</div>
      ) : null}
    </div>
  );
}

export function Input({ error, className = "", ...props }) {
  return (
    <input
      className={`input ${error ? "has-error" : ""} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ error, mono, className = "", ...props }) {
  return (
    <textarea
      className={`textarea ${mono ? "textarea-mono" : ""} ${
        error ? "has-error" : ""
      } ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, checked, onChange, ...props }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} {...props} />
      {label}
    </label>
  );
}
