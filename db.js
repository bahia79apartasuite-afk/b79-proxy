// db.js — almacenamiento en Supabase, hablado por HTTPS con fetch.
//
// Se usa la API REST en vez de la librería oficial para no añadir dependencias:
// el proyecto sigue corriendo con Node puro.
//
// No toca LobbyPMS. Aquí sólo viven usuarios e historial, que son datos
// nuestros; los de huéspedes se siguen leyendo del PMS y no se guardan.
//
// Variables en Render:
//   SUPABASE_URL   https://xxxxx.supabase.co
//   SUPABASE_KEY   la clave service_role (NUNCA la mandes al navegador)

const URL_BASE = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const CLAVE = (process.env.SUPABASE_KEY || '').trim();

const HAY_BASE = !!(URL_BASE && CLAVE);

function cabeceras(extra) {
            return Object.assign({
                            'apikey': CLAVE,
                            'Authorization': 'Bearer ' + CLAVE,
                            'Content-Type': 'application/json',
            }, extra || {});
}

async function pedir(ruta, opciones) {
            if (!HAY_BASE) return { ok: false, error: 'sin_base_de_datos' };
            const r = await fetch(URL_BASE + '/rest/v1/' + ruta, opciones);
            const texto = await r.text();
            let cuerpo = null;
            if (texto) { try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = texto; } }
            if (!r.ok) return { ok: false, error: 'supabase_' + r.status, detalle: cuerpo };
            return { ok: true, datos: cuerpo };
}

// ------------------------------------------------------------------ usuarios

async function buscarUsuario(usuario) {
            const r = await pedir('usuarios?usuario=eq.' + encodeURIComponent(String(usuario).toLowerCase()) +
                                  '&activo=eq.true&select=*&limit=1', { headers: cabeceras() });
            if (!r.ok) return r;
            return { ok: true, usuario: Array.isArray(r.datos) && r.datos[0] ? r.datos[0] : null };
}

async function listarUsuarios() {
            const r = await pedir('usuarios?select=id,usuario,nombre,rol,activo,creado&order=creado.desc',
                                  { headers: cabeceras() });
            if (!r.ok) return r;
            // Se recortan los campos aquí además de pedirlos en el select: si
            // alguien cambia la consulta, o la base devuelve de más, el hash y
            // la sal no salen igual. La seguridad no debe depender del select.
            const usuarios = (r.datos || []).map(u => ({
                            id: u.id, usuario: u.usuario, nombre: u.nombre,
                            rol: u.rol, activo: u.activo, creado: u.creado
            }));
            return { ok: true, usuarios };
}

async function crearUsuario({ usuario, nombre, rol, sal, hash }) {
            return await pedir('usuarios', {
                            method: 'POST',
                            headers: cabeceras({ 'Prefer': 'return=representation' }),
                            body: JSON.stringify([{
                                                usuario: String(usuario).toLowerCase().trim(),
                                                nombre: String(nombre).trim(),
                                                rol: rol === 'admin' ? 'admin' : 'personal',
                                                sal, hash, activo: true
                            }])
            });
}

async function cambiarEstadoUsuario(id, activo) {
            return await pedir('usuarios?id=eq.' + encodeURIComponent(id), {
                            method: 'PATCH',
                            headers: cabeceras({ 'Prefer': 'return=representation' }),
                            body: JSON.stringify({ activo: !!activo })
            });
}

async function cambiarClaveUsuario(id, sal, hash) {
            return await pedir('usuarios?id=eq.' + encodeURIComponent(id), {
                            method: 'PATCH',
                            headers: cabeceras(),
                            body: JSON.stringify({ sal, hash })
            });
}

// ----------------------------------------------------------------- historial

// Nunca se guardan datos de huéspedes en el detalle: sólo qué se hizo, quién y
// cuándo. Si alguien consulta el aseo, se anota la fecha consultada y cuántas
// habitaciones salieron, no quiénes son.
async function anotar(evento) {
            if (!HAY_BASE) return { ok: false, error: 'sin_base_de_datos' };
            try {
                            return await pedir('eventos', {
                                                method: 'POST',
                                                headers: cabeceras({ 'Prefer': 'return=minimal' }),
                                                body: JSON.stringify([{
                                                                        usuario_id: evento.usuario_id || null,
                                                                        usuario: evento.usuario || null,
                                                                        accion: evento.accion,
                                                                        detalle: evento.detalle || null,
                                                                        ip: evento.ip || null
                                                }])
                            });
            } catch (e) {
                            // el historial nunca debe tumbar la operación que lo generó
                            return { ok: false, error: 'anotar_fallo', detalle: e.message };
            }
}

async function listarEventos({ limite = 100, desde, usuario } = {}) {
            let ruta = 'eventos?select=*&order=momento.desc&limit=' + Math.min(Number(limite) || 100, 500);
            if (desde) ruta += '&momento=gte.' + encodeURIComponent(desde);
            if (usuario) ruta += '&usuario=eq.' + encodeURIComponent(usuario);
            const r = await pedir(ruta, { headers: cabeceras() });
            if (!r.ok) return r;
            return { ok: true, eventos: r.datos || [] };
}

async function contarUsuarios() {
            const r = await pedir('usuarios?select=id&limit=1', { headers: cabeceras({ 'Prefer': 'count=exact' }) });
            return r.ok ? { ok: true, hay: Array.isArray(r.datos) && r.datos.length > 0 } : r;
}

module.exports = {
            HAY_BASE, buscarUsuario, listarUsuarios, crearUsuario,
            cambiarEstadoUsuario, cambiarClaveUsuario,
            anotar, listarEventos, contarUsuarios
};
