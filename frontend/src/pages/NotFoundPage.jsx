import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";

export default function NotFoundPage() {
  return (
    <div className="page page-narrow text-center" style={{ paddingTop: 90 }}>
      <div className="icon-wrap icon-box icon-box-lg" style={{ margin: "0 auto 16px" }}>
        <Icon name="compass" size={32} className="icon-muted" />
      </div>
      <h1 style={{ fontSize: 30 }}>Página no encontrada</h1>
      <p className="text-soft">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link to="/" className="btn btn-primary mt">
        Volver al inicio
      </Link>
    </div>
  );
}
