# GenExamenes IA

Backend para generar exámenes con IA, procesar la salida de un LLM y exportar preguntas a Moodle XML.

**Guía detallada de flujo, endpoints, ejemplos y errores:** [GUIA_API_Y_FLUJO.md](GUIA_API_Y_FLUJO.md)

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
- `MAX_STORAGE_BYTES_PER_TEMPLATE`: cupo total de almacenamiento por examen (materiales + imágenes).

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
3. Subir materiales de referencia (PDF, DOCX, TXT, PNG, JPG…) a la plantilla.
4. Generar un prompt guiado para el LLM (incluye el texto extraído de los ficheros).
5. Generar preguntas automáticamente con el LLM o parsear una salida externa en JSON/TXT.
6. Guardar las preguntas validadas en PostgreSQL.
7. Consultar el historial de exámenes creados.
8. Exportar el examen a Moodle XML, TXT o JSON.

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

`POST /exam/templates/{template_id}/materials`

Sube un fichero (`multipart/form-data`, campo `file`). Formatos: PDF, DOCX, TXT, MD, PNG, JPG, WEBP. Extrae texto y lo guarda como contexto.

`GET /exam/templates/{template_id}/materials`

Lista los materiales subidos a una plantilla.

`DELETE /exam/templates/{template_id}/materials/{material_id}`

Elimina un material.

`POST /exam/templates/{template_id}/images`

Sube una imagen para preguntas visuales (`file`, opcional `caption`). No se usa OCR: la imagen se muestra en el examen y se embebe en el XML de Moodle.

`GET /exam/templates/{template_id}/images`

Lista las imágenes de la plantilla.

`GET /exam/images/{image_id}/content`

Devuelve la imagen (requiere JWT). Para previsualizar en el frontend o en Moodle tras importar.

`DELETE /exam/templates/{template_id}/images/{image_id}`

Elimina una imagen.

`PATCH /exam/questions/{question_id}/image`

Vincula o desvincula una imagen a una pregunta existente (`{"image_id": "uuid"}` o `null`).

`POST /exam/templates`

Crea una plantilla con materia, nivel educativo, tipos de pregunta, puntuación, penalización y dificultad.

`GET /exam/templates`

Lista las plantillas del usuario autenticado.

`GET /exam/templates/{template_id}`

Obtiene una plantilla concreta.

`GET /exam/templates/{template_id}/storage`

Muestra cuánto espacio usa el examen (materiales + imágenes) y el límite configurado.

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
