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

## Arquitectura

`pages.js` tiene sólo HTML: ni credenciales, ni
login, ni llamadas al PMS. **Para cambiar el diseño de una página, edita `pages.js` y no abras
`server.js`** — así tocar la interfaz nunca puede romper la autenticación.

### `server.js`

1. `loginLobby()` — login en 4 pasos contra LobbyPMS, todo con `multipart/form-data`:
   `GET /entrar` (cookie inicial) → `POST /entrar/validarhotel` → `POST /entrar/getPropertyUsers`
   (elige el usuario cuyo `nombre_completo` contiene "bahia 79") → `POST /entrar/validarDatos`.
2. `ensureSession()` — cachea las cookies 30 minutos y re-loguea cuando expiran.
3. `fetchDashboard(action, date)` — pega a `/dashboard/{getInHouse|getLlegadas|getSalidas}`
   y reintenta una vez si LobbyPMS responde 401/403.
4. `shapeGuest()` / `dedupGuests()` — normalizan el huésped a nombres de campo en español
   y deduplican por `codigo_reserva`.
5. `handleAction()` — router de `?action=`.

### `pages.js`

Exporta `renderPage(page)`, que devuelve el HTML de `inicio` (portada), `aseo`,
`facturacion`, `jacuzzi` o `cajamenor`.
Las páginas no reciben datos incrustados: piden lo suyo por HTTP a
`?action=aseo|llegadas|salidas|facturacion`, como cualquier cliente externo. Aceptan `?api=`
para apuntar a otro origen al probar en local.

**Los enlaces entre páginas nunca deben ser relativos.** Servida desde Netlify en
`/b79-aseo/`, una URL como `?action=html&page=inicio` resuelve a
`/b79-aseo/?action=html&page=inicio`, que `_redirects` vuelve a mandar a aseo: el botón
"Inicio" se quedaría dando vueltas. Por eso cada enlace lleva `data-page` y el script `JS_NAV`
le pone el `href` correcto según el origen (rutas de Netlify, o `?action=html` si sirve el
proxy directo).

## Acciones disponibles

| `?action=` | Qué hace |
|---|---|
| `aseo` / `in_house` | huéspedes en casa |
| `llegadas` | check-ins del día |
| `salidas` | check-outs del día |
| `facturacion` / `all` | los tres, unidos y deduplicados |
| `html` | sirve una página (`&page=inicio\|aseo\|facturacion\|jacuzzi\|cajamenor`); no consulta LobbyPMS |
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
  La página de aseo muestra sólo habitación, nombre, fechas, ocupantes y notas: **no añadas
  identificación, email ni teléfono**, que el personal de limpieza no necesita.
- **Tokens**: este repo no valida ningún token. `X-B79-Token` aparece sólo como cabecera
  permitida en CORS y nada la comprueba. Si algo relacionado con tokens se rompe, el problema
  está en Netlify o en `bahia79apartasuite.com`, no aquí; no inventes validación de tokens ni
  toques ese tema sin que se pida.
- **Sin dependencias nuevas** salvo que se pida: el proyecto corre con Node puro a propósito.
- **Un cambio a la vez**: cuando algo se rompe, aísla el paso concreto que falla antes de
  cambiar nada.
- Sube la versión en la cabecera de `server.js` y en `action=debug` en cualquier cambio que
  altere el comportamiento del servidor.
- Explica en español, claro y directo.

## Probar las páginas sin LobbyPMS

```
node pruebas/js-valido.js      # que el JS del cliente parsee (rápido, sin navegador)
node pruebas/supabase-falso.js # cuentas e historial en memoria, en el 4001
node server.js                 # el proxy, en el 3000
node pruebas/api-falsa.js      # datos inventados, en el 3001
```

Para probar la clave sin tocar el PMS, levanta una segunda pareja:
```
PORT=3002 B79_CLAVE=xxx LOBBY_HOST=127.0.0.1 node server.js
PORT=3003 CLAVE=xxx node pruebas/api-falsa.js
```
`LOBBY_HOST=127.0.0.1` es un seguro: si algo se cuela hacia el PMS, falla en local en vez
de salir a internet.
Y abre `http://localhost:3000/?action=html&page=aseo&api=http://localhost:3001`.
El parámetro `?api=` desvía las lecturas a la API falsa, así que puedes rediseñar
cualquier página sin credenciales, sin internet y sin tocar datos reales.

## Entregable esperado

Cambios probados con `node server.js` en local, commit descriptivo, y un resumen de una línea
de qué cambió y cómo verificarlo. Para las páginas, pruébalas en un navegador de verdad contra
una API falsa con datos inventados (nunca de huéspedes reales) y **mira la captura**: un test
en verde con la pantalla rota no prueba nada.

## Cuentas, roles e historial

Cada persona entra con su usuario y contraseña. Al entrar recibe un token firmado que el
navegador guarda y manda en `X-B79-Token`. Dos roles: `admin` ve todo y da de alta gente;
`personal` ve las cuatro herramientas operativas. **El rol se comprueba en el servidor**,
no sólo escondiendo el menú.

- Contraseñas con `scrypt` y sal por usuario; nunca se guardan en claro.
- El alta del primer admin (`primer_admin`) sólo funciona con la tabla vacía.
- Todo queda en el historial: ingresos, fallos, altas, bajas y consultas. En el detalle
  van la fecha consultada y cuántos resultados salieron, **jamás quiénes son**.
- Puesta en marcha completa en `docs/puesta-en-marcha.md`.

## Clave compartida

`B79_CLAVE` en Render activa una clave para los endpoints con datos de huéspedes
(`aseo`, `llegadas`, `salidas`, `facturacion`, `pwd_check`, `inspect_auth`, `login_test`).
Quedan abiertos `html`, `debug` e `ip`, que no llevan datos.

- **Si la variable está vacía, el proxy queda abierto**, exactamente como estaba antes. Eso
  es a propósito: desplegar esta versión sin definirla no rompe nada.
- La página pide la clave sola cuando recibe un 401 y la guarda en el dispositivo; no vuelve
  a pedirla. Se envía en la cabecera `X-B79-Token`, que ya estaba permitida en CORS.
- Se acepta también por `?clave=` para pruebas manuales, pero **evita esa forma en enlaces
  que compartas**: queda escrita en el historial y en los logs.
- La comparación es de tiempo constante. No la cambies por `===` sin pensarlo.

## Dos trampas de este código

1. **`?api=` desvía datos, nunca la sesión.** Las páginas piden los datos de huéspedes a
   `API` (desviable con `?api=` para probar con datos inventados) y todo lo de identidad a
   `SISTEMA`, que siempre es el proxy. Mezclarlos rompe el acceso al servir desde Netlify,
   donde `location.origin` es el dominio del front y no el del proxy.
2. **`\n` dentro de un template literal.** El HTML se genera con template literals, así que
   `\n` escrito en el JS del cliente se convierte en un salto de línea de verdad. Dentro de
   una expresión regular eso es un error de sintaxis y **mata el script entero en silencio**:
   la página carga y no hace nada. Hay que escribir `\\n`. Corre `node pruebas/js-valido.js`
   después de tocar cualquier `<script>`.
3. **Los enlaces entre páginas nunca son relativos** (ver arriba, `JS_NAV`).
4. **La paleta de categorías está validada para daltonismo.** Salidas, llegadas y en casa
   usan naranja, azul y morado, no rojo/verde/ámbar: esa combinación daba ΔE 3.2 en
   deuteranopia, o sea indistinguible. Si cambias un color, pásalo por el validador de la
   guía de visualización antes de subirlo.

## Estado de las páginas

Las cinco están construidas. `aseo` y `facturacion` leen de LobbyPMS. `jacuzzi` y `cajamenor`
**guardan en el dispositivo** (`localStorage`), porque el proxy no tiene almacenamiento: cada
teléfono ve lo suyo y nada se sincroniza. Por eso ambas traen exportación a CSV — ese es el
respaldo. Si algún día hacen falta compartidos, eso necesita una base de datos, no un parche.

`_redirects` cubre `/b79` (portada) y las cuatro rutas, cada una con y sin barra final.
