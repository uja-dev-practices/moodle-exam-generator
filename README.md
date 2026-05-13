# GenExamenes IA

Backend para generar exámenes con IA, procesar la salida de un LLM y exportar preguntas a Moodle XML.

El proyecto está centrado en backend. La carpeta `frontend` se mantiene vacía a nivel de aplicación, aunque existe un servicio en Docker Compose para reservar el despliegue futuro.

## Stack

- FastAPI
- PostgreSQL
- SQLAlchemy
- Cliente LLM compatible con OpenAI Chat Completions
- Docker Compose con servicios `backend`, `frontend` y `db`

## Puesta en Marcha

Copia el ejemplo de variables dentro de la carpeta del backend:

```bash
cp backend/.env.example backend/.env
```

Después levanta los servicios:

```bash
docker compose up --build
```

La API queda disponible en:

```text
http://localhost:8000
```

## Configuración

El archivo de entorno debe estar en `backend/.env`.

Variables principales:

- `API_KEY`: clave obligatoria para consumir las rutas protegidas.
- `DATABASE_URL`: conexión PostgreSQL usada por el backend.
- `LLM_API_KEY`: clave del proveedor LLM.
- `LLM_BASE_URL`: endpoint compatible con OpenAI.
- `LLM_MODEL`: modelo usado para generar preguntas.
- `ALLOWED_ORIGINS`: orígenes permitidos por CORS.

Todas las rutas bajo `/exam` requieren la cabecera:

```http
X-API-Key: change-me-in-production
```

## Flujo de Usuario

1. Crear una plantilla de examen.
2. Generar un prompt guiado para el LLM.
3. Generar preguntas automáticamente con el LLM o parsear una salida externa en JSON/TXT.
4. Guardar las preguntas validadas en PostgreSQL.
5. Exportar el examen a Moodle XML, TXT o JSON.

## Endpoints

`GET /health`

Comprueba que la API está levantada.

`POST /exam/templates`

Crea una plantilla con materia, nivel educativo, tipos de pregunta, puntuación, penalización y dificultad.

`GET /exam/templates`

Lista las plantillas creadas.

`GET /exam/templates/{template_id}`

Obtiene una plantilla concreta.

`POST /exam/prompts/{template_id}`

Genera un prompt estructurado para IA.

`POST /exam/generate`

Llama al LLM configurado, parsea la respuesta y guarda las preguntas.

`POST /exam/parse`

Procesa una salida externa de IA en formato `json` o `txt`.

`GET /exam/export/xml/{template_id}`

Exporta las preguntas en Moodle XML.

`GET /exam/export/txt/{template_id}`

Exporta las preguntas en texto plano.

`GET /exam/export/json/{template_id}`

Exporta las preguntas en JSON.

## Seguridad

- Autenticación por API key.
- Rate limiting por cliente.
- Límite de tamaño de petición.
- Validación de entrada con Pydantic.
- Manejo uniforme de errores HTTP.
- Sanitización básica de prompts y respuestas antes de persistir/exportar.
