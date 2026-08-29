# Puesta en marcha — pasos en orden

Cuatro cosas, y sólo la primera es imprescindible para que el sistema arranque.

---

## 1. Base de datos (Supabase)

Sin esto no hay cuentas ni historial: el proxy sigue sirviendo las páginas, pero nadie
puede entrar.

1. Entra a **supabase.com**, crea una cuenta y un proyecto nuevo. El plan gratuito sobra
   para el tamaño del hotel.
2. En el proyecto, ve a **SQL Editor**, pega el contenido de `docs/base-de-datos.sql` y
   dale a *Run*. Crea las dos tablas y cierra el acceso público.
3. Ve a **Project Settings → API** y copia dos cosas:
   - **Project URL**, algo como `https://abcdefgh.supabase.co`
   - La clave **`service_role`** (la secreta, no la `anon`)

## 2. Variables en Render

Render → tu servicio → **Environment**:

| Variable | Valor | Para qué |
|---|---|---|
| `SUPABASE_URL` | la Project URL | dónde está la base |
| `SUPABASE_KEY` | la clave `service_role` | permiso para escribir en ella |
| `B79_SECRETO` | una frase larga inventada | firma las sesiones |

**`B79_SECRETO` importa más de lo que parece.** Si no lo defines, el proxy inventa uno
al arrancar y cada redespliegue echa a todo el mundo del sistema. Que sea largo y que no
se lo sepa nadie.

La clave `service_role` da control total sobre la base. Vive sólo en Render; el navegador
nunca la ve, porque el servidor es el único que habla con Supabase.

## 3. Crear tu propia cuenta

Sin terminal. Abre la dirección del sistema en el navegador: como todavía no existe
ninguna cuenta, la pantalla de acceso se convierte sola en un formulario de alta que dice
*"Este sistema todavía no tiene dueño"*. Escribe tu nombre, un usuario y una contraseña de
al menos 8 caracteres, y entras directo.

Esa puerta **sólo funciona mientras no exista ningún usuario**. En cuanto creas la primera
cuenta se cierra sola: el siguiente que abra la página ve el acceso normal. Por eso conviene
hacerlo tú, y hacerlo primero.

A partir de ahí das de alta al resto desde **Usuarios**.

## 4. Sitio del personal

Ver `docs/sitio-del-personal.md`. Publica la carpeta `sitio-equipo` en Netlify y reparte
esa dirección.

---

## Cómo comprobar que quedó bien

Abre `https://b79-proxy.onrender.com/?action=debug`. Debe decir:

```json
{ "version": "9.0", "base_de_datos": true, "secreto_efimero": false }
```

- `base_de_datos: false` → faltan `SUPABASE_URL` o `SUPABASE_KEY`.
- `secreto_efimero: true` → falta `B79_SECRETO`; las sesiones se caerán en cada despliegue.

---

## Qué queda registrado en el historial

Cada ingreso, cada intento fallido, cada alta o baja de cuenta, cada cambio de contraseña
y cada consulta de datos, con quién y cuándo.

**No se guarda ningún dato de huéspedes.** De una consulta de aseo queda anotado "consultó
el aseo del 29/08, 7 resultados" — nunca quiénes son. Los datos de los huéspedes siguen
viviendo sólo en LobbyPMS.

## Los dos roles

- **Administración** ve todo, incluidos Historial y Usuarios, y da de alta a la gente.
- **Personal** ve Panel, Aseo, Facturación, Jacuzzi y Caja menor. Si intenta entrar a
  Historial escribiendo la dirección a mano, el servidor lo frena: no es sólo que el menú
  se lo esconda.
