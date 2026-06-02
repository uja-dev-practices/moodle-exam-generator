import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getTemplate,
  getTemplateStorage,
  listQuestions,
} from "../api/templates";
import { listMaterials } from "../api/materials";
import { listImages } from "../api/images";
import { useToast } from "../context/ToastContext";
import { SpinnerCenter } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Misc";
import OverviewTab from "./template/OverviewTab";
import MaterialsTab from "./template/MaterialsTab";
import ImagesTab from "./template/ImagesTab";
import GenerateTab from "./template/GenerateTab";
import QuestionsTab from "./template/QuestionsTab";
import ExportTab from "./template/ExportTab";
import Icon from "../components/ui/Icon";

const TABS = [
  { id: "overview", label: "Resumen", icon: "clipboard" },
  { id: "materials", label: "Material IA", icon: "book" },
  { id: "images", label: "Imágenes", icon: "image" },
  { id: "generate", label: "Generar", icon: "sparkles" },
  { id: "questions", label: "Preguntas", icon: "help" },
  { id: "export", label: "Exportar", icon: "upload" },
];

export default function TemplateDetailPage() {
  const { templateId } = useParams();
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [template, setTemplate] = useState(null);
  const [storage, setStorage] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [images, setImages] = useState([]);
  const [questions, setQuestions] = useState([]);

  const reloadStorage = useCallback(async () => {
    try {
      setStorage(await getTemplateStorage(templateId));
    } catch {
      /* silencioso */
    }
  }, [templateId]);

  const reloadMaterials = useCallback(async () => {
    setMaterials(await listMaterials(templateId));
  }, [templateId]);

  const reloadImages = useCallback(async () => {
    setImages(await listImages(templateId));
  }, [templateId]);

  const reloadQuestions = useCallback(async () => {
    setQuestions(await listQuestions(templateId));
  }, [templateId]);

  const reloadTemplate = useCallback(async () => {
    setTemplate(await getTemplate(templateId));
  }, [templateId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getTemplate(templateId),
      getTemplateStorage(templateId).catch(() => null),
      listMaterials(templateId).catch(() => []),
      listImages(templateId).catch(() => []),
      listQuestions(templateId).catch(() => []),
    ])
      .then(([tpl, stg, mats, imgs, qs]) => {
        if (!active) return;
        setTemplate(tpl);
        setStorage(stg);
        setMaterials(mats);
        setImages(imgs);
        setQuestions(qs);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404 || err.status === 403) setNotFound(true);
        else toast.error(err.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  if (loading) return <SpinnerCenter label="Cargando examen…" />;

  if (notFound) {
    return (
      <div className="page page-narrow text-center" style={{ paddingTop: 70 }}>
        <div className="icon-wrap icon-box icon-box-lg" style={{ margin: "0 auto 16px" }}>
          <Icon name="lock" size={32} className="icon-muted" />
        </div>
        <h1>Examen no disponible</h1>
        <p className="text-soft">
          No existe o no tienes permiso para verlo.
        </p>
        <Link to="/" className="btn btn-primary mt">
          Volver a mis exámenes
        </Link>
      </div>
    );
  }

  const shared = {
    templateId,
    template,
    storage,
    materials,
    images,
    questions,
    reloadStorage,
    reloadMaterials,
    reloadImages,
    reloadQuestions,
    reloadTemplate,
    goToTab: setTab,
  };

  return (
    <div className="page">
      <div className="text-sm text-faint mb">
        <Link to="/">Mis exámenes</Link> / {template.title}
      </div>
      <div className="page-header">
        <div>
          <h1>{template.title}</h1>
          <div className="meta-row mt">
            <Badge variant="primary">{template.subject}</Badge>
            <span className="icon-wrap">
              <Icon name="graduation" size={14} className="icon-inline" />
              {template.educational_level}
            </span>
            <span className="icon-wrap">
              <Icon name="globe" size={14} className="icon-inline" />
              {template.language?.toUpperCase()}
            </span>
            <Badge variant={questions.length > 0 ? "success" : undefined}>
              {questions.length} preguntas
            </Badge>
          </div>
        </div>
      </div>

      <div className="tabs-select-wrap">
        <label className="field-label" htmlFor="template-tab-select">
          Sección actual
        </label>
        <select
          id="template-tab-select"
          className="select"
          value={tab}
          onChange={(e) => setTab(e.target.value)}
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            {t.id === "materials" && materials.length > 0 && (
              <span className="tab-count">{materials.length}</span>
            )}
            {t.id === "images" && images.length > 0 && (
              <span className="tab-count">{images.length}</span>
            )}
            {t.id === "questions" && questions.length > 0 && (
              <span className="tab-count">{questions.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab {...shared} />}
      {tab === "materials" && <MaterialsTab {...shared} />}
      {tab === "images" && <ImagesTab {...shared} />}
      {tab === "generate" && <GenerateTab {...shared} />}
      {tab === "questions" && <QuestionsTab {...shared} />}
      {tab === "export" && <ExportTab {...shared} />}
    </div>
  );
}
