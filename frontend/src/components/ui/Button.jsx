import Spinner from "./Spinner";

export default function Button({
  variant = "primary",
  size,
  block,
  loading,
  disabled,
  children,
  className = "",
  ...props
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    size === "lg" ? "btn-lg" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner light={variant === "primary" || variant === "danger"} />}
      {children}
    </button>
  );
}
