# Sitio del personal — cómo publicarlo

Las herramientas internas (aseo, facturación, jacuzzi, caja menor) van en un sitio
**aparte** de la web comercial. Así el personal entra por una dirección propia, y publicar
una cosa nunca puede romper la otra.

Lo único que se publica es la carpeta `sitio-equipo/`, que contiene un solo archivo:
`_redirects`. No lleva dominio: funciona en la dirección que elijas.

---

## Publicarlo en Netlify (unos 5 minutos)

1. Entra a Netlify → **Add new site** → **Import an existing project** → elige este repo.
2. En la configuración del sitio:
   - **Branch to deploy:** `main`
   - **Build command:** déjalo vacío
   - **Publish directory:** `sitio-equipo`
3. Deploy.

**El paso 2 importa.** Si dejas el publish directory en la raíz, Netlify serviría también
`server.js` y `pages.js` como archivos de texto. No hay contraseñas ahí —viven en las
variables de Render— pero sí quedaría a la vista cómo funciona el login contra LobbyPMS.
Apuntando a `sitio-equipo` sólo se publica el archivo de rutas.

## Elegir la dirección

Cualquiera de las dos sirve; las rutas son las mismas.

**Gratis, sin tocar tu dominio.** Netlify te da algo como `b79-equipo.netlify.app`.
En *Site configuration → Change site name* le pones el nombre que quieras.

**Subdominio propio,** por ejemplo `equipo.tudominio.com`. En Netlify, *Domain management
→ Add a domain*, y en tu proveedor de DNS creas un registro CNAME apuntando al sitio.
Se ve más serio y no mezcla nada con la web comercial.

## Direcciones que quedan

| Para | Dirección |
|---|---|
| Portada | `/` |
| Aseo | `/aseo` |
| Facturación | `/facturacion` |
| Jacuzzi | `/jacuzzi` |
| Caja menor | `/caja-menor` |

Cualquier otra dirección cae en la portada en vez de dar 404.

Al personal le basta con la portada: desde ahí llegan a todo. Vale la pena que la guarden
en la pantalla de inicio del teléfono (en el navegador, *Añadir a pantalla de inicio*).

---

## Antes de repartir el enlace

**Define `B79_CLAVE` en Render.** Sin esa variable el proxy está abierto: cualquiera con la
dirección ve los datos de tus huéspedes. Con ella, cada empleado escribe la clave una vez en
su teléfono y no se la vuelve a pedir.

Render → tu servicio → *Environment* → `B79_CLAVE` = la que elijas.

Comprueba que quedó activa abriendo `https://b79-proxy.onrender.com/?action=debug`:
debe decir `"clave_activa": true`.

## El sitio anterior

Las rutas viejas (`/b79-aseo`, `/b79-facturacion`…) siguen funcionando si ese sitio sigue
publicado, y la navegación entre páginas se adapta sola a cada esquema. Cuando el personal
esté usando el sitio nuevo, puedes borrar el `_redirects` de la raíz y ese sitio de Netlify.
