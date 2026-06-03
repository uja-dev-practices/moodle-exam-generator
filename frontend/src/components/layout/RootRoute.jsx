import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SpinnerCenter } from "../ui/Spinner";
import DashboardPage from "../../pages/DashboardPage";

/** Raíz de la app: login si no hay sesión, dashboard si la hay. */
export default function RootRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <SpinnerCenter label="Cargando tu sesión…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardPage />;
}
