# Despliegue en Sinbad2 (HTTPS vía Apache)

Patrón equivalente a **orcid2sword**: TLS en Apache, contenedores en HTTP en puertos internos.

## URL pública

`https://sinbad2.ujaen.es/generadorexamenesllm/`

No usar `/deckofcars/` ni `/deckofcards/` (son otros proyectos).

## 1. GitLab CI (este repositorio)

El job `deploy_to_sinbad2` en `.gitlab-ci.yml`:

1. Copia el código por SSH a Sinbad2.
2. Ejecuta `docker compose build` y `docker compose up -d`.
3. Expone servicios en **HTTP** (sin certificados en Docker):
   - Frontend → `:8069`
   - Backend → `:8068`

Variables de despliegue:

| Variable | Valor |
|----------|--------|
| `VITE_APP_BASE_PATH` | `/generadorexamenesllm/` |
| `VITE_API_URL` | *(vacío: misma base HTTPS vía nginx)* |
| `ENVIRONMENT` | `production` |
| `PUBLIC_BASE_URL` | `https://sinbad2.ujaen.es/generadorexamenesllm` |
| `ALLOWED_ORIGINS` | `https://sinbad2.ujaen.es,...` |

## 2. Apache (gestión UJA — no está en este repo)

Configuración confirmada por sistemas (mismo estilo que `orcid2sword` → `:8073`):

```apache
ProxyPass        /generadorexamenesllm  http://host.docker.internal:8069/
ProxyPassReverse /generadorexamenesllm  http://host.docker.internal:8069/
```

**Importante:** esas líneas deben ir **antes** de las reglas de WordPress del sitio Sinbad2.
Si no, Apache sigue devolviendo la web del grupo (cabeceras `X-Powered-By: PHP` y `X-Redirect-By: WordPress`).

Comprobación rápida tras recargar Apache:

```bash
curl -I https://sinbad2.ujaen.es/generadorexamenesllm/
# Debe mostrar Server: nginx (contenedor), NO PHP/WordPress
```

| Paso | Qué ocurre |
|------|------------|
| Certificado SSL | Lo proporciona el servidor institucional |
| Entrada pública | `https://sinbad2.ujaen.es/generadorexamenesllm/` |
| Proxy | Apache reenvía a `:8069` (HTTP) y **quita** el prefijo |
| Nginx contenedor | Sirve SPA y hace proxy de `/auth/` y `/exam/` al backend |

Si falta el `ProxyPass`, la ruta la atiende el CMS de Sinbad2 (home del grupo).

## 3. Adaptaciones en la aplicación

### Frontend

- Build con `VITE_APP_BASE_PATH=/generadorexamenesllm/`.
- `nginx.conf` entiende rutas **con prefijo** (acceso directo `:8069`) y **sin prefijo** (tras Apache).
- Proxy interno al backend; cabeceras `X-Forwarded-Proto` / `Host` propagadas desde Apache.

### Backend

- Uvicorn con `--proxy-headers` y `--forwarded-allow-ips *`.
- `TrustedHostMiddleware` + cabeceras HSTS en producción.
- CORS con origen `https://sinbad2.ujaen.es`.

## 4. Comprobaciones

```bash
# Directo al contenedor (HTTP, con prefijo)
curl -I http://sinbad2.ujaen.es:8069/generadorexamenesllm/

# Tras Apache (HTTPS)
curl -I https://sinbad2.ujaen.es/generadorexamenesllm/

# API vía nginx del frontend
curl https://sinbad2.ujaen.es/generadorexamenesllm/health
```
