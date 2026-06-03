# GenExámenes IA — Frontend

Interfaz web en **React + Vite** para el generador de exámenes con IA. Consume
la API del backend (FastAPI) y cubre todo el flujo: autenticación, plantillas,
material de contexto, imágenes, generación con IA, gestión de preguntas y
exportación a Moodle.

## Stack

- **React 18** + **React Router 6**
- **Vite 5** (build y dev server)
- **Axios** con interceptores para el token JWT y el manejo unificado de errores HTTP

## Estructura

```
src/
  api/         Cliente axios y un módulo por recurso (auth, templates, materials, images, ...)
  components/  Componentes reutilizables (UI, layout, AuthImage, QuestionCard, ...)
  context/     AuthContext (sesión) y ToastContext (notificaciones)
  hooks/       useGoogleSignIn (login con Google opcional)
  pages/       Páginas y pestañas del detalle de plantilla
  utils/       Constantes y formateadores
```

## Desarrollo local

Requisitos: Node 20+ y el backend corriendo en `http://sinbad2.ujaen.es:8068`.

```bash
cd frontend
cp .env.example .env      # ajusta VITE_API_URL si es necesario
npm install
npm run dev               # http://sinbad2.ujaen.es:8075
```

## Variables de entorno

| Variable                | Descripción                                              |
| ----------------------- | -------------------------------------------------------- |
| `VITE_APP_BASE_PATH`    | Base pública de la SPA (debe terminar en `/`). En producción UJA: `/generadorexamenesllm/`. |
| `VITE_API_URL`          | URL base de la API. Si se deja vacía, usa la misma base pública de la app. |
| `VITE_GOOGLE_CLIENT_ID` | (Opcional) Client ID de Google. Si está vacío, se oculta el botón de Google. |

> Las variables `VITE_*` se incrustan en el build, por lo que apuntan al backend
> tal y como lo verá el navegador del usuario.

## Build de producción

```bash
npm run build     # genera dist/
npm run preview   # sirve el build localmente
```

## Docker

El `docker-compose.yml` de la raíz construye el frontend con un build multi-stage
(Node → Nginx) y lo publica en `http://sinbad2.ujaen.es:8075`:

```bash
docker compose up --build
```

Las variables `VITE_APP_BASE_PATH`, `VITE_API_URL` y `VITE_GOOGLE_CLIENT_ID` pueden pasarse como
variables de entorno al ejecutar `docker compose`.

## Despliegue HTTPS en Sinbad2 (patrón orcid2sword)

Documentación completa: [`deploy/DESPLIEGUE_SINBAD2.md`](../deploy/DESPLIEGUE_SINBAD2.md)

Resumen:

| Capa | Responsabilidad |
|------|-----------------|
| Apache (UJA) | Certificado SSL, `ProxyPass` a `:8069` |
| GitLab CI | `docker compose up`, build con base path |
| Nginx contenedor | SPA + proxy `/auth/` y `/exam/` al backend |
| Backend Uvicorn | `--proxy-headers`, HSTS, CORS HTTPS |

URL pública: **`https://sinbad2.ujaen.es/generadorexamenesllm/`**

Apache (fragmento):

```apache
ProxyPass        /generadorexamenesllm  http://host.docker.internal:8069/
ProxyPassReverse /generadorexamenesllm  http://host.docker.internal:8069/
```

Build:

```env
VITE_APP_BASE_PATH=/generadorexamenesllm/
VITE_API_URL=
```

El navegador habla solo con HTTPS (Apache → nginx → backend); no hay mixed content ni CORS cruzado entre puertos.

## Manejo de errores

Todas las respuestas de error del backend siguen el formato
`{ "error": { "code", "message", "details" } }`. El interceptor de Axios las
normaliza a una `ApiError` y la UI las muestra mediante *toasts*. Un `401`
global cierra la sesión automáticamente.
