import { useEffect, useState } from "react";
import { fetchImageBlobUrl } from "../api/images";
import Spinner from "./ui/Spinner";

/**
 * El endpoint de contenido de imagen requiere Authorization, por lo que
 * no se puede usar directamente en src. Descargamos el blob con el token.
 */
export default function AuthImage({ imageId, alt, className = "thumb" }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl;
    setUrl(null);
    setError(false);
    fetchImageBlobUrl(imageId)
      .then((u) => {
        objectUrl = u;
        if (active) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (error) {
    return (
      <div className={className} style={{ display: "grid", placeItems: "center" }}>
        <span className="text-faint text-sm">No disponible</span>
      </div>
    );
  }
  if (!url) {
    return (
      <div className={className} style={{ display: "grid", placeItems: "center" }}>
        <Spinner />
      </div>
    );
  }
  return <img src={url} alt={alt || "Imagen"} className={className} />;
}
