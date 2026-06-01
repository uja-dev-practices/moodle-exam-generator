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

Requisitos: Node 20+ y el backend corriendo en `http://localhost:8000`.

```bash
cd frontend
cp .env.example .env      # ajusta VITE_API_URL si es necesario
npm install
npm run dev               # http://localhost:5173
```

## Variables de entorno

| Variable                | Descripción                                              |
| ----------------------- | -------------------------------------------------------- |
| `VITE_API_URL`          | URL base del backend (por defecto `http://localhost:8000`). |
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
(Node → Nginx) y lo publica en `http://localhost:5173`:

```bash
docker compose up --build
```

Las variables `VITE_API_URL` y `VITE_GOOGLE_CLIENT_ID` pueden pasarse como
variables de entorno al ejecutar `docker compose`.

## Manejo de errores

Todas las respuestas de error del backend siguen el formato
`{ "error": { "code", "message", "details" } }`. El interceptor de Axios las
normaliza a una `ApiError` y la UI las muestra mediante *toasts*. Un `401`
global cierra la sesión automáticamente.
