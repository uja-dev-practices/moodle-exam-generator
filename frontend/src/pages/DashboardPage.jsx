import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTemplates } from "../api/templates";
import { useToast } from "../context/ToastContext";
import { SpinnerCenter } from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import { Badge, EmptyState } from "../components/ui/Misc";
import { formatLastUpdated } from "../utils/format";
import Icon from "../components/ui/Icon";

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listTemplates()
      .then((data) => active && setTemplates(data))
      .catch((err) => toast.error(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <SpinnerCenter label="Cargando tus exámenes…" />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mis exámenes</h1>
          <p className="page-lead">Gestiona tus plantillas de examen y genera preguntas con IA.</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={() => navigate("/plantillas/nueva")} size="lg">
            <Icon name="plus" size={16} className="icon-inline" />
            Nuevo examen
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="folder"
            title="Aún no tienes exámenes"
            message="Crea tu primera plantilla para empezar a generar preguntas con IA."
            action={
              <Button onClick={() => navigate("/plantillas/nueva")}>
                Crear mi primer examen
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cards">
          {templates.map((t) => (
            <div
              key={t.id}
              className="card template-card"
              onClick={() => navigate(`/plantillas/${t.id}`)}
            >
              <div className="template-card-top" />
              <div className="card-pad">
                <div className="flex justify-between items-center mb">
                  <Badge variant="primary">{t.subject}</Badge>
                  <Badge variant={t.question_count > 0 ? "success" : undefined}>
                    {t.question_count} preg.
                  </Badge>
                </div>
                <h3 style={{ marginBottom: 6 }}>{t.title}</h3>
                <div className="meta-row mt">
                  <span className="icon-wrap">
                    <Icon name="graduation" size={14} className="icon-inline" />
                    {t.educational_level}
                  </span>
                  <span className="icon-wrap">
                    <Icon name="globe" size={14} className="icon-inline" />
                    {t.language?.toUpperCase()}
                  </span>
                </div>
                <div className="divider-line" />
                <div className="text-sm text-faint">
                  {formatLastUpdated(t.updated_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
