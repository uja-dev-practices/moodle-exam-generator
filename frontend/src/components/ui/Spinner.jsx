export default function Spinner({ large, light }) {
  const classes = [
    "spinner",
    large ? "spinner-lg" : "",
    light ? "spinner-light" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return <span className={classes} aria-label="Cargando" />;
}

export function SpinnerCenter({ label }) {
  return (
    <div className="spinner-center">
      <div className="text-center">
        <Spinner large />
        {label && <p className="text-soft mt">{label}</p>}
      </div>
    </div>
  );
}
