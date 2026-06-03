const TOKEN_KEY = "genex_token";

/**
 * Si el usuario entra en la raíz de la app sin sesión, redirige a /login
 * antes de montar React (evita pantalla en blanco por basename sin barra final).
 */
export function redirectRootToLoginIfNeeded() {
  const base = import.meta.env.BASE_URL || "/";
  const baseNoSlash = base.replace(/\/$/, "");
  const { pathname, search, hash } = window.location;
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isAppRoot =
    normalizedPath === baseNoSlash ||
    normalizedPath === "/" ||
    pathname === base;

  if (!isAppRoot) return;
  if (localStorage.getItem(TOKEN_KEY)) return;

  const loginUrl = `${baseNoSlash}/login${search}${hash}`;
  if (pathname + search + hash !== `${baseNoSlash}/login${search}${hash}`) {
    window.location.replace(loginUrl);
  }
}
