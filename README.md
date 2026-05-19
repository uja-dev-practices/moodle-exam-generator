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

- `JWT_SECRET_KEY`: secreto para firmar tokens JWT (mínimo 32 caracteres).
- `JWT_EXPIRE_MINUTES`: duración del token de acceso.
- `GOOGLE_CLIENT_ID`: Client ID de OAuth 2.0 en Google Cloud Console (para `/auth/google`).
- `DATABASE_URL`: conexión PostgreSQL usada por el backend.
- `LLM_API_KEY`: clave del proveedor LLM.
- `LLM_BASE_URL`: endpoint compatible con OpenAI.
- `LLM_MODEL`: modelo usado para generar preguntas.
- `ALLOWED_ORIGINS`: orígenes permitidos por CORS.

Todas las rutas bajo `/exam` requieren autenticación de usuario con:

```http
Authorization: Bearer <access_token>
```

Si ya tenías una base de datos creada antes de añadir usuarios, recrea el volumen:

```bash
docker compose down -v
docker compose up --build
```

## Flujo de Usuario

1. Registrarse o iniciar sesión.
2. Crear una plantilla de examen (queda asociada al usuario).
3. Generar un prompt guiado para el LLM.
4. Generar preguntas automáticamente con el LLM o parsear una salida externa en JSON/TXT.
5. Guardar las preguntas validadas en PostgreSQL.
6. Consultar el historial de exámenes creados.
7. Exportar el examen a Moodle XML, TXT o JSON.

## Endpoints

`GET /health`

Comprueba que la API está levantada.

`POST /auth/register`

Registra un usuario con email y contraseña.

`POST /auth/login`

Devuelve un token JWT para usar en las rutas protegidas.

`POST /auth/google`

Recibe el `id_token` de Google (Sign in with Google en el frontend), verifica la cuenta y devuelve el mismo JWT de la API.

`GET /auth/me`

Devuelve los datos del usuario autenticado.

`GET /exam/history`

Lista el historial de exámenes del usuario (plantillas, preguntas y exportaciones).

`POST /exam/templates`

Crea una plantilla con materia, nivel educativo, tipos de pregunta, puntuación, penalización y dificultad.

`GET /exam/templates`

Lista las plantillas del usuario autenticado.

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

- Registro e inicio de sesión con contraseña hasheada (bcrypt).
- Autenticación JWT por usuario.
- Cada examen pertenece a un único usuario; no se puede acceder al de otro.
- Rate limiting por cliente.
- Límite de tamaño de petición.
- Validación de entrada con Pydantic.
- Manejo uniforme de errores HTTP.
- Sanitización básica de prompts y respuestas antes de persistir/exportar.
