# Guía de uso de la API y flujo de la aplicación

Documento resumen para entender **qué hace el usuario en cada paso**, **qué endpoint usar**, **cabeceras**, **cuerpos**, **ejemplos de respuesta** y **errores típicos**.

**Base URL de ejemplo:** `http://localhost:8074`

---

## 1. Conceptos rápidos

| Concepto | Significado |
|----------|-------------|
| **Usuario** | Cada persona tiene su cuenta; los exámenes son suyos. |
| **Plantilla (template)** | Configuración de un examen: título, materia, tipos de pregunta, dificultad, etc. |
| **Materiales** | Ficheros para **extraer texto** y dar **contexto a la IA** (PDF, DOCX, TXT; imágenes aquí se procesan con OCR para texto). |
| **Imágenes de examen** | Imágenes para **mostrar en la pregunta** en Moodle; no se usan como texto de contexto para la IA. |
| **Preguntas** | Se generan con la IA, se pegan manualmente (parse) o se ajustan después. |
| **Exportación** | Salida Moodle XML, TXT o JSON. |

**Autenticación:** casi todo va con JWT:

```http
Authorization: Bearer <access_token>
```

Las rutas bajo `/exam/...` **requieren** ese header (salvo que indiquemos lo contrario).

**Formato de error habitual** (API propia):

```json
{
  "error": {
    "code": "codigo_corto",
    "message": "Texto legible para humanos",
    "details": null
  }
}
```

(`details` solo aparece en algunos errores de validación.)

**Otros códigos:** `401` token inválido o ausente, `403` recurso de otro usuario, `404` no existe, `409` conflicto (email duplicado, cupo, etc.), `413` fichero o cupo demasiado grande, `422` validación o parseo, `429` demasiadas peticiones, `503` servicio externo no configurado (p. ej. Google o LLM).

---

## 2. Flujo de uso (orden recomendado)

Hasta el **examen exportable** (normalmente Moodle XML): autenticación → plantilla → (materiales + imágenes) → generar preguntas → exportar.

### Tres piezas que debes distinguir

| Pieza | Para qué sirve | Endpoints |
|-------|----------------|-----------|
| **Materiales** | Extraen **texto** (PDF, DOCX, TXT; imagen aquí = OCR) y alimentan el **prompt** de la IA. | `POST/GET/DELETE …/templates/{id}/materials` |
| **Imágenes de examen** | Solo para **mostrar** la figura en la pregunta / Moodle (`image_id`). **No** aportan texto al prompt. | `POST/GET/DELETE …/templates/{id}/images`, `GET …/images/{id}/content`, `PATCH …/questions/{id}/image` |
| **IA** | Crea y **guarda** las preguntas en BD. | `POST …/prompts/{id}`, `POST …/generate`, `POST …/parse` |

```text
Materiales → texto en prompt ─┐
Imágenes   → catálogo ids    ─┼→ generate/parse → preguntas → export/xml
```

**Importante:** “Leer” un escaneado como texto → **material**. “Que el alumno vea la foto” → **imagen de examen** (pueden ser el mismo fichero subido dos veces si necesitas ambas cosas).

---

### Pasos (qué hacer y endpoint)

Todas las rutas `/exam/*` llevan `Authorization: Bearer <token>`.

| # | Qué haces | Endpoint(s) |
|---|-----------|-------------|
| 1 | Registro o login; guardas el JWT | `POST /auth/register`, `POST /auth/login` o `POST /auth/google` |
| 2 | Creas el examen (tipos, nº preguntas, dificultad); guardas **`template_id`** | `POST /exam/templates` |
| 3 | *(Opc.)* Subes apuntes; compruebas estado **`processed`** | `POST …/materials` (`file`), `GET …/materials` |
| 4 | *(Opc.)* Subes figuras para preguntas; anotas cada **`image_id`** | `POST …/images` (`file`, `caption` opcional), `GET …/images` |
| 5 | *(Opc.)* Ves cuota de espacio (materiales + imágenes) | `GET …/templates/{id}/storage` |
| 6 | Generas preguntas (ver tabla abajo) | `prompts` / `generate` / `parse` |
| 7 | *(Opc.)* Corriges imagen de una pregunta | `PATCH …/questions/{id}/image` |
| 8 | *(Opc.)* Listado de tus exámenes | `GET /exam/history` |
| 9 | Descargas el examen (hay que tener preguntas) | `GET …/export/xml/{id}` (Moodle), `…/txt`, `…/json` |

---

### Generación con IA (paso 6)

Body habitual en **prompts** y **generate**:

```json
{ "topic_prompt": "…instrucciones…", "material_ids": null }
```

`material_ids`: `null` = todos los materiales OK; o lista de UUIDs concretos.

| Opción | Endpoint | Resultado |
|--------|----------|-----------|
| Ver/copiar prompt (sin LLM en servidor) | `POST /exam/prompts/{template_id}` | Texto del prompt |
| Generar y guardar en servidor | `POST /exam/generate` (+ `template_id`) | Preguntas en BD; requiere `LLM_API_KEY` |
| Pegar JSON/TXT de otra IA | `POST /exam/parse` | Preguntas en BD |

El prompt incluye texto de **materiales** y catálogo de **imágenes**. La IA puede poner **`image_id`** en cada pregunta; el backend **no** obliga “una imagen = una pregunta” (solo lo que pidas en `topic_prompt` + revisión o `PATCH`).

Detalle de cuerpos, respuestas y errores: **sección 4** de esta guía.

---

## 3. Cabeceras comunes

| Cabecera | Cuándo |
|----------|--------|
| `Content-Type: application/json` | Peticiones con body JSON. |
| `Authorization: Bearer <token>` | Rutas protegidas (`/exam/*`, `/auth/me`). |
| `multipart/form-data` | Subida de ficheros (el cliente lo pone automáticamente con `curl -F`). |

**No** hace falta `X-API-Key` para el flujo normal de usuario (sigue existiendo en configuración por compatibilidad, pero el acceso a exámenes es por JWT).

---

## 4. Endpoints por bloques

### 4.1 Salud del servicio

#### `GET /health`

**Qué hace:** Comprueba que el servidor responde. **No** requiere autenticación.

**Headers:** ninguno obligatorio.

**Body:** no.

**Ejemplo:**

```bash
curl -s http://localhost:8074/health
```

**Respuesta OK (200):**

```json
{ "status": "ok" }
```

**Error típico:** si el servidor está caído, no hay respuesta HTTP (no es JSON de la API).

---

### 4.2 Autenticación (`/auth`)

#### `POST /auth/register`

**Qué hace:** Crea usuario con email y contraseña.

**Headers:** `Content-Type: application/json`

**Body:**

```json
{
  "email": "profesor@ejemplo.com",
  "password": "Minimo8caracteres",
  "full_name": "María García"
}
```

**Ejemplo:**

```bash
curl -s -X POST http://localhost:8074/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"profesor@ejemplo.com","password":"ClaveSegura1","full_name":"María"}'
```

**Respuesta OK (201):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "profesor@ejemplo.com",
  "full_name": "María",
  "created_at": "2026-05-19T10:00:00+00:00"
}
```

**Error típico (409):** email ya registrado.

```json
{
  "error": {
    "code": "conflict",
    "message": "Email is already registered"
  }
}
```

---

#### `POST /auth/login`

**Qué hace:** Devuelve el **JWT** para el resto de llamadas.

**Body:**

```json
{
  "email": "profesor@ejemplo.com",
  "password": "ClaveSegura1"
}
```

**Respuesta OK (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error típico (401):** credenciales incorrectas.

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid email or password"
  }
}
```

---

#### `POST /auth/google`

**Qué hace:** Inicia sesión o registra con el **id_token** de Google (desde el frontend con Sign in with Google).

**Headers:** `Content-Type: application/json`

**Body:**

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Requisitos:** `GOOGLE_CLIENT_ID` en `backend/.env`.

**Respuesta OK (200):** igual que login (`access_token`).

**Error típico (503):** Google no configurado.

```json
{
  "error": {
    "code": "google_not_configured",
    "message": "Google login is not configured"
  }
}
```

**Error típico (401):** token de Google inválido o email no verificado.

---

#### `GET /auth/me`

**Qué hace:** Devuelve los datos del usuario logueado.

**Headers:** `Authorization: Bearer <token>`

**Body:** no.

**Respuesta OK (200):** mismo esquema que register (sin password).

**Error típico (401):** falta token o token caducado.

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired token"
  }
}
```

---

### 4.3 Plantillas de examen (`/exam/templates`)

Todas requieren: `Authorization: Bearer <token>`

#### `POST /exam/templates`

**Qué hace:** Crea una plantilla nueva asociada al usuario.

**Body (JSON):** ver `ExamTemplateCreate` en el código; resumen:

- `title`, `subject`, `educational_level`, `language`
- `settings.question_types`: lista de `{ "type": "multichoice"|"truefalse"|"shortanswer"|"matching", "count", "options_count", "multiple_correct", "score", "penalty" }`
- `settings.shuffle_questions`, `shuffle_answers`, `include_feedback`
- `difficulty_profile`: `easy`, `medium`, `hard`, `very_hard` (al menos uno > 0)

**Ejemplo mínimo:**

```bash
curl -s -X POST http://localhost:8074/exam/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Examen UD3",
    "subject": "Bases de datos",
    "educational_level": "CFGS DAW",
    "language": "es",
    "settings": {
      "question_types": [
        {"type": "multichoice", "count": 5, "options_count": 4, "multiple_correct": false, "score": 1, "penalty": 0.25}
      ],
      "shuffle_questions": true,
      "shuffle_answers": true,
      "include_feedback": true
    },
    "difficulty_profile": {"easy": 2, "medium": 2, "hard": 1, "very_hard": 0}
  }'
```

**Respuesta OK (201):** plantilla con `id`, fechas, `question_count`, etc.

**Error típico (422):** JSON mal formado o reglas de validación (p. ej. suma de dificultades vacía).

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request payload",
    "details": [ { "loc": ["body", "difficulty_profile"], "msg": "...", "type": "value_error" } ]
  }
}
```

---

#### `GET /exam/templates`

**Qué hace:** Lista las plantillas del usuario.

**Respuesta OK (200):** array de plantillas.

**Error típico (401):** sin token.

---

#### `GET /exam/templates/{template_id}`

**Qué hace:** Obtiene una plantilla concreta.

**Parámetros URL:** `template_id` (UUID).

**Error típico (404):** no existe o no es tuya.

```json
{
  "error": {
    "code": "not_found",
    "message": "Exam template not found"
  }
}
```

**Error típico (403):** plantilla de otro usuario.

```json
{
  "error": {
    "code": "forbidden",
    "message": "You do not have access to this exam template"
  }
}
```

---

#### `GET /exam/templates/{template_id}/storage`

**Qué hace:** Muestra cuánto espacio ocupan **materiales + imágenes** de esa plantilla frente al cupo (`MAX_STORAGE_BYTES_PER_TEMPLATE`).

**Respuesta OK (200) ejemplo:**

```json
{
  "template_id": "...",
  "used_bytes": 1048576,
  "limit_bytes": 52428800,
  "remaining_bytes": 51380224,
  "materials_bytes": 524288,
  "images_bytes": 524288,
  "used_mb": 1.0,
  "limit_mb": 50.0
}
```

**Error típico:** mismo 404/403 que la plantilla.

---

### 4.4 Materiales de contexto (`/exam/templates/.../materials`)

Sirven para **texto** que la IA puede usar al generar (PDF, DOCX, TXT, MD; imágenes aquí → OCR para texto).

#### `POST /exam/templates/{template_id}/materials`

**Headers:** `Authorization` + `multipart/form-data`

**Body:** campo formulario `file` = fichero.

**Ejemplo:**

```bash
curl -s -X POST "http://localhost:8074/exam/templates/TEMPLATE_UUID/materials" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./apuntes.pdf"
```

**Respuesta OK (201):** objeto con `material` (id, estado `processed` o `failed`, vista previa de texto si hay) y `message`.

**Errores típicos:**

| Código | Situación |
|--------|-----------|
| 413 | Fichero mayor que `MAX_UPLOAD_BYTES` o cupo total de plantilla superado (`template_storage_quota_exceeded`). |
| 415 | Extensión no permitida. |
| 409 | Demasiados ficheros (`too_many_files`). |

Ejemplo cupo:

```json
{
  "error": {
    "code": "template_storage_quota_exceeded",
    "message": "Template storage quota exceeded. Limit: 50.00 MB, used: 48.00 MB, file: 5.00 MB"
  }
}
```

---

#### `GET /exam/templates/{template_id}/materials`

Lista materiales de la plantilla. **200:** array.

---

#### `DELETE /exam/templates/{template_id}/materials/{material_id}`

Borra un material. **204:** sin cuerpo.

**Error típico (404):** material o plantilla no encontrados.

---

### 4.5 Imágenes de examen (`/exam/templates/.../images` y `/exam/images/...`)

Solo para **mostrar en la pregunta** (Moodle); no rellenan el contexto de texto de la IA.

#### `POST /exam/templates/{template_id}/images`

**Body:** `multipart/form-data` con `file` obligatorio y `caption` opcional.

**Ejemplo:**

```bash
curl -s -X POST "http://localhost:8074/exam/templates/TEMPLATE_UUID/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./diagrama.png" \
  -F "caption=Diagrama del modelo ER"
```

**Respuesta OK (201):** incluye `image.id` y `content_url` tipo `/exam/images/{id}/content`.

**Errores típicos:** 413 tamaño / cupo, 415 tipo no imagen, 422 imagen corrupta, 409 demasiadas imágenes.

---

#### `GET /exam/templates/{template_id}/images`

Lista imágenes. **200:** array.

---

#### `GET /exam/images/{image_id}/content`

Devuelve el **binario** de la imagen (previsualización o descarga). **200** con `Content-Type` de imagen.

**Headers:** `Authorization: Bearer <token>`

**Error típico (404):** id inexistente o imagen de otro usuario.

---

#### `DELETE /exam/templates/{template_id}/images/{image_id}`

Borra imagen y desvincula de preguntas. **204** sin cuerpo.

---

### 4.6 Vincular imagen a pregunta (`/exam/questions`)

#### `PATCH /exam/questions/{question_id}/image`

**Qué hace:** Asigna o quita la imagen de una pregunta ya guardada.

**Headers:** `Authorization`, `Content-Type: application/json`

**Body:**

```json
{ "image_id": "UUID-de-imagen-de-la-misma-plantilla" }
```

o para quitar:

```json
{ "image_id": null }
```

**Respuesta OK (200):** pregunta con campos incl. `image_url` si hay imagen.

**Errores típicos:** 404 pregunta no tuya; 404 `image_id` no pertenece a la plantilla de esa pregunta.

---

### 4.7 Generación con IA (`/exam`)

Todas con `Authorization: Bearer <token>`.

#### `POST /exam/prompts/{template_id}`

**Qué hace:** Construye el **texto del prompt** (incluye materiales procesados y catálogo de imágenes de examen) sin llamar al LLM.

**Body:**

```json
{
  "topic_prompt": "Genera preguntas sobre normalización y formas normales.",
  "material_ids": null
}
```

`material_ids`: lista de UUIDs de materiales concretos, o `null` para usar **todos** los materiales con estado `processed`.

**Respuesta OK (200):**

```json
{
  "template_id": "...",
  "prompt": "Eres un generador...",
  "expected_format": "json"
}
```

**Errores típicos:** 404 plantilla; 404 si en `material_ids` pides un material que no existe o no está procesado.

---

#### `POST /exam/generate`

**Qué hace:** Llama al **LLM**, parsea JSON y **guarda** preguntas.

**Body:**

```json
{
  "template_id": "UUID-plantilla",
  "topic_prompt": "Enfócate en claves foráneas e integridad referencial.",
  "material_ids": null
}
```

**Respuesta OK (200):** `{ "questions": [ { ...pregunta..., "image_id": null, "image_url": null } ] }`

**Errores típicos:**

| Código | Ejemplo |
|--------|---------|
| 503 | `LLM_API_KEY` no configurada (`llm_unavailable`). |
| 422 | JSON del modelo inválido (`parse_error`). |

```json
{
  "error": {
    "code": "llm_unavailable",
    "message": "LLM_API_KEY is not configured"
  }
}
```

---

#### `POST /exam/parse`

**Qué hace:** Pegas la salida de una IA externa (JSON o TXT) y se validan y guardan preguntas.

**Body:**

```json
{
  "template_id": "UUID-plantilla",
  "input_format": "json",
  "raw_output": "{\"questions\":[...]}"
}
```

**Respuesta OK (200):** igual que generate (`questions`).

**Error típico (422):** `parse_error` si el formato no cuadra con el esquema de preguntas.

---

### 4.8 Historial (`/exam/history`)

#### `GET /exam/history`

**Qué hace:** Lista exámenes del usuario (plantillas) con resumen (preguntas, exportaciones, fechas).

**Respuesta OK (200):** array de `ExamHistoryItem`.

**Error típico (401):** sin token.

---

### 4.9 Exportación (`/exam/export`)

Requiere que la plantilla **tenga preguntas** guardadas.

#### `GET /exam/export/xml/{template_id}`

**Respuesta OK (200):** cuerpo **XML** (`Content-Type: application/xml`). Incluye imágenes embebidas si las preguntas las tienen.

**Error típico (404):** sin preguntas aún.

```json
{
  "error": {
    "code": "not_found",
    "message": "Template does not contain questions to export"
  }
}
```

---

#### `GET /exam/export/txt/{template_id}`

**200:** texto plano.

---

#### `GET /exam/export/json/{template_id}`

**200:** JSON con lista de preguntas.

---

## 5. Cómo elegir imagen por pregunta (recordatorio)

Resumen ya integrado en la **sección 2.4** (subida y catálogo) y **2.7** (PATCH). En corto:

1. `POST /exam/templates/{template_id}/images` → anota cada **`id`**.
2. `POST /exam/generate` (o prompt + IA externa + `parse`) → el JSON puede incluir **`image_id`** por pregunta.
3. `PATCH /exam/questions/{question_id}/image` → corrección manual.

---

## 6. Límites y buenas prácticas (recordatorio)

- **Cupo total por plantilla:** `MAX_STORAGE_BYTES_PER_TEMPLATE` (materiales + imágenes). Consulta `GET .../storage` antes de subir mucho.
- **Tamaño por fichero:** materiales `MAX_UPLOAD_BYTES`, imágenes `MAX_IMAGE_BYTES`.
- **Contexto en el prompt:** el texto de materiales se trunca (`MAX_REFERENCE_CHARS`); no metas PDFs enormes sin trocear en el futuro.
- **Misma imagen para contexto OCR y para mostrar en examen:** hoy son dos rutas (`/materials` vs `/images`); si solo quieres **mostrar**, usa solo `/images`.

---

## 7. Orden de lectura del código

| Área | Carpeta / archivos |
|------|---------------------|
| Rutas | `backend/app/api/routes/` |
| Esquemas | `backend/app/schemas/` |
| Lógica de negocio | `backend/app/services/` |
| Modelos BD | `backend/app/models/exam.py`, `user.py` |
| Configuración | `backend/app/core/config.py`, `backend/.env.example` |

---

*Documento generado para el proyecto GenExamenes / moodle-exam-generator. Ajusta la base URL y los UUID de ejemplo a tu entorno real.*
