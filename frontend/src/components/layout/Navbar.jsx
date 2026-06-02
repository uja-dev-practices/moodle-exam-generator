import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/format";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <span className="brand-logo">
            <Icon name="document" size={18} />
          </span>
          <span className="brand-text">GenExámenes IA</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="nav-mobile-toggle"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <Icon name={mobileOpen ? "close" : "listChecks"} size={18} />
        </Button>

        <div className={`nav-collapse ${mobileOpen ? "open" : ""}`}>
          <nav className="nav-links">
            <NavLink to="/" end className="nav-link" onClick={closeMobileMenu}>
              Mis exámenes
            </NavLink>
            <NavLink to="/plantillas/nueva" className="nav-link" onClick={closeMobileMenu}>
              Crear examen
            </NavLink>
          </nav>
          <span className="nav-spacer" />
          <div className="nav-user">
            <div className="avatar" title={user?.email}>
              {initials(user?.full_name || user?.email)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                closeMobileMenu();
                setConfirmOut(true);
              }}
            >
              Salir
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        title="Cerrar sesión"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOut(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={doLogout}>
              Cerrar sesión
            </Button>
          </>
        }
      >
        <p className="text-soft" style={{ margin: 0 }}>
          ¿Seguro que quieres cerrar la sesión de <strong>{user?.email}</strong>?
        </p>
      </Modal>
    </header>
  );
}
