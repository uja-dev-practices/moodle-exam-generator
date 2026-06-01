import Icon from "./Icon";

export function Badge({ variant, children }) {
  return <span className={`badge ${variant ? `badge-${variant}` : ""}`}>{children}</span>;
}

export function EmptyState({ icon = "inbox", title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon icon-wrap icon-box icon-box-lg">
        <Icon name={icon} size={28} className="icon-muted" />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="mt">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
