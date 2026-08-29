# Configuración de Claude — plan aplicado

Basado en *"Configura Claude desde cero"* de Maurys Alvarez, adaptado a tu caso real.

La guía cubre dos mundos distintos. Lo que se configura con **archivos** ya quedó hecho en
este repo. Lo que se configura en la **interfaz de claude.ai** sólo lo puedes hacer tú desde
tu cuenta; abajo está listo para copiar y pegar.

---

## Parte A — Hecho en el repo

| Paso de la guía | Dónde quedó |
|---|---|
| 3 — Instrucción maestra del proyecto | `CLAUDE.md` |
| 5 — Prompt de delegación guardado | `/delegar` (`.claude/commands/delegar.md`) |
| 3 — Prompt de arquitecto de proyecto | `/instruccion-proyecto` |
| 7 — Primera Skill | pendiente: el candidato obvio (diagnosticar el proxy) queda descartado por decisión tuya; hay que elegir otro proceso |
| Bonus — Estilo de trabajo | reglas al final de `CLAUDE.md` + permisos en `.claude/settings.json` |

Cómo se usan: escribe `/delegar <tarea>` o `/instruccion-proyecto <proyecto>` en Claude Code
y se cargan solos.

**Límite explícito:** LobbyPMS y el proxy en vivo están fuera del alcance de Claude. La regla
está escrita en `CLAUDE.md` y reforzada en `.claude/settings.json`, que bloquea `curl` y
`wget`. Si algún día quieres levantar ese límite, se quita esa regla — no antes.

---

## Parte B — Para pegar en claude.ai (5 minutos)

### 1. Instrucciones personales

`claude.ai` → tu inicial (abajo a la izquierda) → **Settings** → **Profile / Preferencias
personales**. Pega esto:

> Dirijo el Hotel Bahía 79 Apartasuite y además produzco contenido e infoproductos. Trabajo
> en español; respóndeme siempre en español.
>
> - Empieza por la recomendación o el resultado; el razonamiento va después.
> - No me des teoría que no termine en una acción concreta.
> - Párrafos cortos y listas sólo cuando faciliten la lectura.
> - Si falta un dato importante, búscalo tú primero en los archivos o conectores que tengo;
>   pregúntame sólo lo que no puedas averiguar solo.
> - Para decisiones, compara las opciones reales y recomienda una, con una frase de por qué.
> - No inventes cifras, fechas ni nombres de huéspedes. Si no lo sabes, dilo.
> - Cuando entregues algo, que esté listo para usar, no a medio hacer.

**Ajusta la primera línea si mi lectura de tu negocio no es exacta** — la deduje del repo y de
tus skills instaladas, no me la confirmaste.

### 2. Proyectos (empieza con 4, no con 20)

`claude.ai` → **Projects** → *Create project*. Para cada uno, pega su instrucción en
"Project instructions" y sube sólo los archivos que de verdad hagan falta.

| Proyecto | Para qué | Qué subirle |
|---|---|---|
| **HOTEL — Operación** | ocupación, tarifas, LobbyPMS, aseo, facturación, caja menor | procedimientos, tarifario, ejemplos de reportes |
| **HOTEL — Huéspedes y ventas** | respuestas a reservas, OTAs, reseñas, política de cancelación | plantillas de mensajes, política actual |
| **CONTENIDO** | carruseles, infoproductos, guiones | voz de marca, ofertas, 10–20 posts que funcionaron |
| **IDEAS** | lo que aún no ejecutas | nada al inicio; se llena solo |

Regla de la guía que sí conviene respetar: **no mezcles el hotel con el contenido en el mismo
proyecto**. El contexto de uno ensucia las respuestas del otro.

Instrucción base para cualquiera de ellos (ajústala en cada uno):

> Objetivo de este proyecto: [una frase].
> Contexto: [quién soy y para quién es el resultado].
> Reglas: no inventes datos; si algo falta, pregúntalo antes de asumir.
> Entregable: [formato exacto que quiero recibir].

### 3. Conectores

Ya tienes conectados Google Drive, Gmail, Google Calendar, Notion, Trello, Canva y GitHub —
más de los que la guía recomienda como mínimo. La recomendación real aquí es la contraria a
"conecta más": **revisa y quita lo que no uses**, en Settings → Connectors. Cada conector
activo es acceso permanente a esos datos.

Ejemplos que te van a servir con lo que ya tienes:

- "Busca en Drive los documentos de tarifas 2026 y dame las 5 decisiones pendientes."
- "Revisa mis correos de Booking de esta semana y hazme un resumen con próximos pasos."
- "Revisa mi calendario y dime qué bloques libres tengo para trabajo profundo."

### 4. Artifacts

Ya está activo (esta sesión puede publicarlos). Úsalo cuando el resultado tenga que existir
como algo que ves y editas, no como texto en un chat. Para tu caso: un tablero de ocupación
del mes, una calculadora de tarifa por temporada, o la página visual del proceso de aseo.

---

## Prueba final

Dale una tarea real y pregúntate lo que propone la guía: ¿entendió el objetivo?, ¿usó el
contexto correcto?, ¿el resultado está listo para usar?, ¿podría repetirlo mañana sin
explicárselo todo otra vez?

## Siguiente nivel

No configures todo hoy. Elige **un** proceso que hoy te quite tiempo y que no dependa de
LobbyPMS — la respuesta a reservas, el cierre de caja menor, el guion de un carrusel — y
conviértelo en Skill. Después repite.
