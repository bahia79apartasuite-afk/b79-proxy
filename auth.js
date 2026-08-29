// auth.js — identidad: contraseñas y sesiones.
//
// No toca LobbyPMS ni la base de datos: sólo cifra, firma y verifica.
// Usa el módulo `crypto` de Node, así que no añade ninguna dependencia.

const crypto = require('crypto');

// Secreto con el que se firman las sesiones. Si no está definido, se genera uno
// al arrancar: el proxy sigue funcionando, pero cada redespliegue cierra la
// sesión de todos. Defínelo en Render para que eso no pase.
const SECRETO = (process.env.B79_SECRETO || '').trim() || crypto.randomBytes(32).toString('hex');
const SECRETO_EFIMERO = !(process.env.B79_SECRETO || '').trim();

const DURACION_SESION_HORAS = 12;

// --------------------------------------------------------------- contraseñas

function nuevaSal() {
            return crypto.randomBytes(16).toString('hex');
}

function derivar(clave, sal) {
            return crypto.scryptSync(String(clave), sal, 64).toString('hex');
}

function hashearClave(clave) {
            const sal = nuevaSal();
            return { sal, hash: derivar(clave, sal) };
}

function claveCorrecta(clave, sal, hash) {
            if (!clave || !sal || !hash) return false;
            const calculado = Buffer.from(derivar(clave, sal), 'hex');
            const guardado = Buffer.from(String(hash), 'hex');
            if (calculado.length !== guardado.length) return false;
            return crypto.timingSafeEqual(calculado, guardado);
}

// ------------------------------------------------------------------ sesiones
//
// El token viaja en la cabecera X-B79-Token, no en una cookie: las páginas se
// sirven desde un dominio (Netlify) y piden los datos a otro (Render), y una
// cookie entre dominios distintos trae más problemas que soluciones.

function base64url(buf) {
            return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeBase64url(s) {
            return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function firma(texto) {
            return base64url(crypto.createHmac('sha256', SECRETO).update(texto).digest());
}

function crearSesion(usuario) {
            const payload = {
                            id: usuario.id,
                            usuario: usuario.usuario,
                            nombre: usuario.nombre,
                            rol: usuario.rol,
                            exp: Date.now() + DURACION_SESION_HORAS * 3600 * 1000
            };
            const cuerpo = base64url(JSON.stringify(payload));
            return cuerpo + '.' + firma(cuerpo);
}

function leerSesion(token) {
            if (!token || typeof token !== 'string') return null;
            const partes = token.split('.');
            if (partes.length !== 2) return null;
            const [cuerpo, recibida] = partes;
            const esperada = firma(cuerpo);
            const a = Buffer.from(recibida);
            const b = Buffer.from(esperada);
            if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
            let payload;
            try { payload = JSON.parse(desdeBase64url(cuerpo)); } catch (e) { return null; }
            if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
            return payload;
}

module.exports = {
            hashearClave, claveCorrecta, crearSesion, leerSesion,
            SECRETO_EFIMERO, DURACION_SESION_HORAS
};
