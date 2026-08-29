# B79 SISTEM — Proxy LobbyPMS

Instrucción maestra del proyecto. Léela antes de tocar código.

## Qué es esto

`b79-proxy` es un servidor Node (sin dependencias, sólo `http`/`https` nativos) que actúa como
puente entre las páginas operativas del Hotel Bahía 79 Apartasuite y LobbyPMS
(`app.lobbypms.com`), que no expone una API pública usable. El proxy se autentica con
cookies de sesión y devuelve JSON con CORS abierto.

- Despliegue: Render → `https://b79-proxy.onrender.com`
- Front: Netlify, con las rutas de `_redirects` (`/b79-aseo`, `/b79-facturacion`,
  `/b79-jacuzzi`, `/b79-caja-menor`)
- Propiedad LobbyPMS: `14965`

## Arquitectura (todo vive en `server.js`)

1. `loginLobby()` — login en 4 pasos contra LobbyPMS, todo con `multipart/form-data`:
   `GET /entrar` (cookie inicial) → `POST /entrar/validarhotel` → `POST /entrar/getPropertyUsers`
   (elige el usuario cuyo `nombre_completo` contiene "bahia 79") → `POST /entrar/validarDatos`.
2. `ensureSession()` — cachea las cookies 30 minutos y re-loguea cuando expiran.
3. `fetchDashboard(action, date)` — pega a `/dashboard/{getInHouse|getLlegadas|getSalidas}`
   y reintenta una vez si LobbyPMS responde 401/403.
4. `shapeGuest()` / `dedupGuests()` — normalizan el huésped a nombres de campo en español
   y deduplican por `codigo_reserva`.
5. `handleAction()` — router de `?action=`.

## Acciones disponibles

| `?action=` | Qué hace |
|---|---|
| `aseo` / `in_house` | huéspedes en casa |
| `llegadas` | check-ins del día |
| `salidas` | check-outs del día |
| `facturacion` / `all` | los tres, unidos y deduplicados |
| `debug` (por defecto) | versión y estado de sesión |
| `login_test` | fuerza un login limpio |
| `pwd_check`, `inspect_auth`, `ip` | diagnóstico |

Parámetro `date=YYYY-MM-DD`; por defecto, hoy.

## Reglas de trabajo

- **No tocar LobbyPMS.** Regla dura, por encima de cualquier otra cosa en este archivo:
  no modifiques el flujo de login (`loginLobby`, `ensureSession`, `fetchDashboard`), no llames
  a `app.lobbypms.com` ni al proxy en vivo, y no ejecutes `curl` contra ninguno de los dos.
  Si un problema parece venir de ahí, **descríbelo y detente**; no lo diagnostiques ni lo
  arregles salvo que yo lo pida explícitamente en esa conversación.
- **Secretos**: `LOBBY_USER`, `LOBBY_PASS`, `LOBBY_HOST`, `LOBBY_PROPERTY_ID` viven en las
  variables de entorno de Render. Nunca los escribas en el código, en un commit, en un log
  ni en una respuesta. `pwd_check` expone los códigos de carácter de la contraseña: no lo
  llames ni compartas su salida salvo que se pida un diagnóstico explícito de esa variable.
- **Datos de huéspedes**: nombre, identificación, email y teléfono son datos personales.
  No los pegues en commits, issues ni artifacts de ejemplo; usa datos inventados.
- **Sin dependencias nuevas** salvo que se pida: el proyecto corre con Node puro a propósito.
- **Un cambio a la vez**: cuando algo se rompe, aísla el paso concreto que falla antes de
  cambiar nada.
- Sube la versión en la cabecera de `server.js` y en `action=debug` en cualquier cambio que
  altere el comportamiento del servidor.
- Explica en español, claro y directo.

## Entregable esperado

Cambios en `server.js` probados contra el proxy en vivo (o con `node server.js` local +
`curl`), commit descriptivo, y un resumen de una línea de qué endpoint cambió y cómo verificarlo.

## Cabo suelto conocido

`_redirects` apunta a `?action=html&page=...`, pero `handleAction()` no implementa `html`:
esas cuatro rutas responden `unknown_action`. Queda anotado como contexto; no lo arregles
por iniciativa propia.
