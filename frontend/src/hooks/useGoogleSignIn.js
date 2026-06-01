import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Carga Google Identity Services y renderiza el botón oficial.
 * Solo se activa si VITE_GOOGLE_CLIENT_ID está configurado.
 * onCredential recibe el id_token que enviaremos a /auth/google.
 */
export function useGoogleSignIn(onCredential) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const enabled = Boolean(GOOGLE_CLIENT_ID);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!enabled) return;

    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current?.(response.credential),
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 340,
          text: "continue_with",
          shape: "rectangular",
        });
      }
      setReady(true);
    }

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) init();
      else existing.addEventListener("load", init);
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.body.appendChild(script);
  }, [enabled]);

  return { buttonRef, enabled, ready };
}
