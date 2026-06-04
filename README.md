# GenExámenes IA

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-109989?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-0db7ed?style=for-the-badge&logo=docker&logoColor=white)
![Moodle](https://img.shields.io/badge/Moodle_XML-FF7800?style=for-the-badge)
![LLM](https://img.shields.io/badge/Sinbad2IA-LLM-6C63FF?style=for-the-badge)

</div>

<div align="center">
  <strong>Plataforma full-stack para diseñar exámenes con IA, gestionar materiales de contexto y exportar bancos de preguntas a Moodle XML, TXT y JSON.</strong>
</div>

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Overview: What is this project meant

`GenExámenes IA` está pensado para flujos docentes en los que hay que crear evaluaciones estructuradas, apoyarse en un LLM y exportar el resultado a Moodle.

Capacidades principales:

- Registro e inicio de sesión (email/contraseña y Google opcional)
- Creación de plantillas de examen (tipos de pregunta, dificultad, barajar, feedback)
- Subida de **Material IA** (PDF, DOCX, TXT, MD…) con extracción de texto para contexto
- Subida de **imágenes** para preguntas visuales (embebidas en Moodle XML)
- Generación de preguntas: **automática** (LLM en servidor), **solo prompt** o **importar JSON/TXT**
- Revisión, vinculación imagen–pregunta y exportación **Moodle XML**, TXT o JSON
- Cupo de almacenamiento por examen y controles de seguridad en producción

> [!NOTE]
> El despliegue en Sinbad2 (UJA) sigue el patrón **orcid2sword**: HTTPS en Apache, contenedores en HTTP en puertos internos (`8069` frontend, `8068` backend). Ver [deploy/DESPLIEGUE_SINBAD2.md](deploy/DESPLIEGUE_SINBAD2.md).

**URL pública (producción):** `https://sinbad2.ujaen.es/generadorexamenesllm/`

**Guía ampliada de API, flujo y errores:** [GUIA_API_Y_FLUJO.md](GUIA_API_Y_FLUJO.md)

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- python-jose (JWT)
- bcrypt (contraseñas)
- httpx (cliente LLM Sinbad2IA)
- pypdf / python-docx / Pillow / pytesseract (extracción de materiales)

### Frontend
- React 18
- Vite 5
- React Router 6
- Axios
- CSS propio (UI responsive, menú móvil)

### Infrastructure
- Docker / Docker Compose
- Nginx (contenedor frontend: SPA + proxy `/auth` y `/exam`)
- Apache reverse proxy (HTTPS en Sinbad2, fuera del repo)

### IA
- Sinbad2IA UJA — `POST {LLM_BASE_URL}/api/chat` (modelo por defecto `qwen3.5:35b`)

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Quick Start

Desde la raíz del proyecto:

```bash
cp backend/.env.example backend/.env
# Edita backend/.env: LLM_BASE_URL y LLM_API_KEY (solo en el servidor, no en Git)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

URLs por defecto con Docker Compose:

| Servicio   | URL local                          |
| :--------- | :--------------------------------- |
| Frontend   | `http://localhost:8069`            |
| Frontend (ruta pública) | `http://localhost:8069/generadorexamenesllm/` |
| Backend    | `http://localhost:8068`            |
| PostgreSQL | `localhost:5432`                   |

Desarrollo del frontend sin Docker (solo UI):

```bash
cd frontend
npm install
npm run dev
```

Vite escucha en `http://localhost:8075` (configurable en `vite.config.js`).

> [!IMPORTANT]
> Las rutas bajo `/exam` requieren JWT de usuario (`Authorization: Bearer <token>`). El material y las imágenes son **opcionales** para generar; basta el campo «Tema / instrucciones para la IA» (mínimo 5 caracteres).

> [!IMPORTANT]
> **Seguridad del LLM:** la URL y la clave del servicio de IA **no** están en el repositorio. `POST /exam/generate` solo funciona si el servidor tiene `LLM_BASE_URL` y `LLM_API_KEY` en `backend/.env`. El backend no se publica en el host en producción (solo nginx en `:8069`). Quien clone el repo **no** puede llamar al LLM sin esas variables en el despliegue.

> [!TIP]
> Si la generación automática devuelve 503 (*Automatic AI generation is not available*), faltan variables LLM en el servidor o el servicio no es alcanzable desde el contenedor. Usa **Solo prompt** → LLM externo → **Pegar respuesta IA**.

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Environment Configuration

**Backend**
- Archivo principal: `backend/.env`
- Referencia: `backend/.env.example`

**Frontend**
- Build Docker / ejemplo: `frontend/.env.example`
- Variables inyectadas en build: `VITE_APP_BASE_PATH`, `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

Variables backend importantes:

| Variable | Descripción |
| :------- | :---------- |
| `JWT_SECRET_KEY` | Secreto JWT (≥ 32 caracteres) |
| `JWT_EXPIRE_MINUTES` | Duración del token |
| `GOOGLE_CLIENT_ID` | OAuth Google (`POST /auth/google`) |
| `DATABASE_URL` | PostgreSQL |
| `ALLOWED_ORIGINS` | Orígenes CORS (HTTPS Sinbad2) |
| `TRUSTED_HOSTS` | Hosts permitidos (`TrustedHostMiddleware`) |
| `PUBLIC_BASE_URL` | URL pública con prefijo de despliegue |
| `LLM_BASE_URL` | URL interna del LLM (**solo** en `.env` del servidor, no en el repo) |
| `LLM_API_KEY` | Clave para autorizar llamadas al LLM (**obligatoria** para generación automática) |
| `LLM_MODEL` | Modelo (p. ej. `qwen3.5:35b`) |
| `LLM_TIMEOUT_SECONDS` | Timeout llamada LLM (180 s por defecto) |
| `LLM_GENERATE_RATE_LIMIT_*` | Cuota de `POST /exam/generate` por usuario |
| `MAX_STORAGE_BYTES_PER_TEMPLATE` | Cupo materiales + imágenes por examen |

Variables frontend importantes:

| Variable | Descripción |
| :------- | :---------- |
| `VITE_APP_BASE_PATH` | Prefijo SPA (`/generadorexamenesllm/` en producción) |
| `VITE_API_URL` | Vacío en producción: API en el mismo origen vía nginx |
| `VITE_GOOGLE_CLIENT_ID` | Debe coincidir con `GOOGLE_CLIENT_ID` del backend |

> [!WARNING]
> No subas secretos reales al repositorio. Rota `JWT_SECRET_KEY` y credenciales de Google antes de producción.

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) API Endpoints

Base backend (Docker local): `http://localhost:8068`

Todas las rutas `/exam/*` requieren **Bearer JWT** salvo que se indique lo contrario.

| Módulo | Método | Endpoint | Auth | Notas |
| :----- | :----: | :------- | :--- | :---- |
| Health | `GET` | `/health` | Ninguna | Liveness |
| Auth | `POST` | `/auth/register` | Ninguna | Email + contraseña |
| Auth | `POST` | `/auth/login` | Ninguna | Devuelve `access_token` |
| Auth | `POST` | `/auth/google` | Ninguna | Body: `{ "id_token": "..." }` |
| Auth | `GET` | `/auth/me` | Bearer | Usuario actual |
| Plantillas | `POST` | `/exam/templates` | Bearer | Crear examen |
| Plantillas | `GET` | `/exam/templates` | Bearer | Listar del usuario |
| Plantillas | `GET` | `/exam/templates/{id}` | Bearer | Detalle |
| Plantillas | `GET` | `/exam/templates/{id}/storage` | Bearer | Uso de almacenamiento |
| Materiales | `POST` | `/exam/templates/{id}/materials` | Bearer | `multipart/form-data` |
| Materiales | `GET` | `/exam/templates/{id}/materials` | Bearer | Listado |
| Imágenes | `POST` | `/exam/templates/{id}/images` | Bearer | Imagen para preguntas |
| Imágenes | `GET` | `/exam/images/{image_id}/content` | Bearer | Contenido binario |
| Preguntas | `GET` | `/exam/templates/{id}/questions` | Bearer | Listado |
| Preguntas | `PATCH` | `/exam/questions/{id}/image` | Bearer | Vincular imagen |
| IA | `POST` | `/exam/prompts/{template_id}` | Bearer | Construir prompt |
| IA | `POST` | `/exam/generate` | Bearer | LLM + guardar preguntas |
| IA | `POST` | `/exam/parse` | Bearer | Importar JSON/TXT externo |
| Export | `GET` | `/exam/export/xml/{template_id}` | Bearer | Moodle XML |
| Export | `GET` | `/exam/export/txt/{template_id}` | Bearer | Texto plano |
| Export | `GET` | `/exam/export/json/{template_id}` | Bearer | JSON |
| Historial | `GET` | `/exam/history` | Bearer | Resumen de exámenes |

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Request Examples

### Health
```bash
curl http://localhost:8068/health
```

### Registro e inicio de sesión
```bash
curl -X POST "http://localhost:8068/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"docente@ujaen.es\",\"password\":\"MiClaveSegura1\",\"password_confirm\":\"MiClaveSegura1\"}"

curl -X POST "http://localhost:8068/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"docente@ujaen.es\",\"password\":\"MiClaveSegura1\"}"
```

### Crear plantilla de examen
```bash
curl -X POST "http://localhost:8068/exam/templates" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Examen Tema 3\",
    \"subject\": \"Sistemas Operativos\",
    \"educational_level\": \"Grado\",
    \"language\": \"es\",
    \"settings\": {
      \"question_types\": [{\"type\": \"multichoice\", \"count\": 5, \"score\": 1, \"penalty\": 0}],
      \"shuffle_questions\": true,
      \"shuffle_answers\": true,
      \"include_feedback\": true
    },
    \"difficulty_profile\": {\"easy\": 2, \"medium\": 3, \"hard\": 0, \"very_hard\": 0}
  }"
```

### Generar preguntas (solo con tema, sin materiales)
```bash
curl -X POST "http://localhost:8068/exam/generate" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"template_id\": \"TEMPLATE_UUID\",
    \"topic_prompt\": \"Genera preguntas sobre aritmética y trigonometría\",
    \"material_ids\": null
  }"
```

### Exportar Moodle XML
```bash
curl "http://localhost:8068/exam/export/xml/TEMPLATE_UUID" \
  -H "Authorization: Bearer YOUR_JWT" \
  -o examen_moodle.xml
```

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Security Controls

Controles implementados en backend:

- CORS con lista de orígenes permitidos
- filtrado de hosts de confianza (`TrustedHostMiddleware`)
- cabeceras de seguridad (HSTS en producción)
- límite de tamaño de petición
- rate limiting por cliente
- **LLM solo desde el servidor:** credenciales en `.env`, sin URL en el código público
- **`POST /exam/generate`:** exige JWT + `LLM_API_KEY` configurada + límite por usuario
- backend **no expuesto** en `docker-compose.yml` (solo red interna Docker; Apache → frontend)
- contraseñas con bcrypt
- JWT por usuario; cada plantilla pertenece a un único usuario
- sanitización de prompts y texto persistido
- contenedores sin privilegios innecesarios

> [!WARNING]
> En producción, fuerza HTTPS detrás de Apache y mantén `ALLOWED_ORIGINS` y `TRUSTED_HOSTS` alineados con `https://sinbad2.ujaen.es`. El servicio LLM de la UJA debería aceptar peticiones **solo** desde la red del backend y exigir `LLM_API_KEY` (firewall + clave en el propio Sinbad2IA).

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Frontend Details

SPA React con rutas protegidas y cliente API centralizado (`frontend/src/api/client.js`).

### Rutas principales

| Ruta | Página |
| :--- | :----- |
| `/login` | Inicio de sesión |
| `/registro` | Alta de usuario |
| `/` | Panel «Mis exámenes» |
| `/plantillas/nueva` | Asistente «Nuevo examen» |
| `/plantillas/:templateId` | Detalle con pestañas: Resumen, Material IA, Imágenes, Generar, Preguntas, Exportar |

### Pestaña Generar (tres modos)

- **Generación automática:** `POST /exam/generate` — llama al LLM del servidor.
- **Solo prompt:** `POST /exam/prompts/{id}` — copiar prompt a un LLM externo.
- **Pegar respuesta IA:** `POST /exam/parse` — importar JSON o TXT.

### Cliente API (`frontend/src/api/`)

- `client.js` — Axios, JWT en `localStorage`, errores normalizados (`ApiError`)
- `auth.js`, `templates.js`, `materials.js`, `images.js`, `generation.js`, `exports.js`, `questions.js`

### Nginx en Docker (`frontend/nginx.conf`)

- Sirve la SPA bajo `/` y `/generadorexamenesllm/`
- Proxy de `/auth/` y `/exam/` al backend (`backend:8074` en red interna)
- Redirección de raíz sin barra final al login

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Project Structure

```text
03_GeneradorExamenes/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── templates.py
│   │   │   │   ├── generation.py
│   │   │   │   ├── materials.py
│   │   │   │   ├── images.py
│   │   │   │   ├── questions.py
│   │   │   │   ├── exports.py
│   │   │   │   └── history.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── auth.py
│   │   │   ├── errors.py
│   │   │   ├── middleware.py
│   │   │   └── security_headers.py
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── exam_service.py
│   │   │   ├── llm.py
│   │   │   ├── prompt_builder.py
│   │   │   ├── parser.py
│   │   │   ├── material_service.py
│   │   │   ├── image_service.py
│   │   │   └── moodle_exporter.py
│   │   └── main.py
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CreateTemplatePage.jsx
│   │   │   ├── TemplateDetailPage.jsx
│   │   │   └── template/
│   │   │       ├── GenerateTab.jsx
│   │   │       ├── MaterialsTab.jsx
│   │   │       └── ExportTab.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── deploy/
│   ├── DESPLIEGUE_SINBAD2.md
│   └── apache-reverse-proxy.conf
├── docs/
│   └── Manual_de_Usuario_GenExamenes_IA.docx
├── scripts/
│   └── generar_manual_usuario.py
├── docker-compose.yml
├── GUIA_API_Y_FLUJO.md
└── README.md
```

---

## ![certificate](https://www.readmecodegen.com/api/social-icon?name=certificate&size=20) Production Checklist

- [ ] `ENVIRONMENT=production`
- [ ] Rotar `JWT_SECRET_KEY` y `GOOGLE_CLIENT_ID` de desarrollo
- [ ] `ALLOWED_ORIGINS` con orígenes HTTPS reales
- [ ] `TRUSTED_HOSTS` con `sinbad2.ujaen.es`
- [ ] `PUBLIC_BASE_URL=https://sinbad2.ujaen.es/generadorexamenesllm`
- [ ] Apache `ProxyPass` a puerto **8069** (frontend), no al backend directo
- [ ] Reglas Apache **antes** de WordPress en Sinbad2
- [ ] `LLM_BASE_URL` y `LLM_API_KEY` solo en `backend/.env` del servidor (no en Git)
- [ ] Comprobar conectividad backend → LLM (red interna UJA)
- [ ] Despliegue con `docker compose up` **sin** `docker-compose.dev.yml` (backend no publicado en host)
- [ ] Volumen `uploads_data` y backups de PostgreSQL
- [ ] Manual de usuario actualizado en `docs/`

---

## ![github](https://www.readmecodegen.com/api/social-icon?name=github&size=20&color=%238b5cf6) Authors and Team

Este proyecto es el resultado de la colaboración con la **Universidad de Jaén** (grupo Sinbad²).

| Rol | Developer | GitHub |
| :--- | :--- | :--- |
| **Frontend** | Alexis López Moral | [@AlexisLopez-Dev](https://github.com/AlexisLopez-Dev) |
| **Backend** | Mireya Cueto Garrido | [@MireyaCueto](https://github.com/MireyaCueto) |

### Direction
* **Project Supervisor:** Luis Martínez López

---

<p align="center">
  Built with professional care and ❤️ for AI-assisted exam workflows at the University of Jaén.
</p>
