---
name: verificar-proxy
description: Diagnostica el proxy b79 contra LobbyPMS cuando una página del hotel (aseo, facturación, jacuzzi, caja menor) no carga datos, devuelve vacío o da error. Úsala también después de cada despliegue en Render para confirmar que el login y los tres endpoints de huéspedes siguen funcionando. Aísla en qué paso exacto falla — despliegue, login de 4 pasos, sesión expirada o forma de los datos — antes de tocar código.
---

# Verificar el proxy B79

Objetivo: saber en menos de dos minutos **qué paso concreto está fallando**, y sólo entonces
proponer un arreglo. LobbyPMS cambia su login sin avisar, así que nunca asumas la causa.

Base: `https://b79-proxy.onrender.com` (o `http://localhost:3000` si estás probando local
con `node server.js`).

## Secuencia de diagnóstico

Ejecútala en orden y **detente en el primer paso que falle** — ese es el problema.

### 1. ¿Está vivo y qué versión corre?

```
curl -s "$BASE/?action=debug"
```

Confirma que `version` coincide con la cabecera de `server.js`. Si no coincide, Render todavía
no desplegó el último commit: espera y repite antes de seguir investigando.

### 2. ¿El login completo funciona?

```
curl -s "$BASE/?action=login_test"
```

Devuelve `detail.steps`, un paso por etapa. Interpreta así:

| Dónde se corta | Qué significa |
|---|---|
| `GET /entrar` sin cookies | LobbyPMS bloquea la IP de Render, o cambió la ruta de login |
| `validarhotel` ≠ 200 | cambió `codigoHotel` o el endpoint; revisa `LOBBY_PROPERTY_ID` |
| `users_parse` | LobbyPMS respondió HTML (normalmente una pantalla de bloqueo), no JSON |
| `no_user_match` | cambió el `nombre_completo` del usuario; el código busca "bahia 79" |
| `validarDatos` ≠ 200 | contraseña incorrecta o expirada en las variables de Render |

### 3. ¿Los datos llegan?

```
curl -s "$BASE/?action=aseo"
curl -s "$BASE/?action=llegadas"
curl -s "$BASE/?action=salidas"
curl -s "$BASE/?action=facturacion"
```

`ok:true` con `total:0` **no siempre es un fallo**: puede que ese día no haya movimiento.
Verifica con una fecha con reservas conocidas: `&date=YYYY-MM-DD`.
Si `ok:true` pero los huéspedes vienen con campos vacíos, LobbyPMS renombró sus campos:
compara la respuesta cruda con lo que espera `shapeGuest()`.

### 4. ¿Cambió el JavaScript de autenticación de LobbyPMS?

Sólo si el paso 2 falló:

```
curl -s "$BASE/?action=inspect_auth&q=validarDatos"
```

Trae el fragmento del `auth.js` de LobbyPMS alrededor del término buscado. Cámbialo por
`validarhotel`, `getPropertyUsers` o `hashId` para ver qué envía hoy el front real.

### 5. ¿Es la IP de salida?

```
curl -s "$BASE/?action=ip"
```

Si LobbyPMS tiene lista blanca de IPs y Render cambió la suya, hay que actualizarla del lado
de LobbyPMS. Esto no se arregla con código.

## Reglas

- **No llames a `pwd_check`** ni pegues su salida en ningún lado: expone la contraseña
  carácter por carácter. Sólo tiene sentido si sospechas de espacios o acentos en la variable
  de Render, y aun así reporta únicamente `pwd_len`.
- **No pegues datos de huéspedes** (nombre, identificación, email, teléfono) en commits,
  issues ni resúmenes compartidos. Cuenta cuántos hay y describe el problema, no las personas.
- **Un arreglo por vez**, con la versión subida en `server.js` y en `action=debug`, para que el
  paso 1 sirva de confirmación en el siguiente despliegue.

## Entregable

Un reporte corto en este formato:

```
Paso que falla: <número y nombre>
Causa probable: <una frase>
Arreglo propuesto: <una frase, o "ninguno: es del lado de LobbyPMS/Render">
Cómo verificar: <el curl que debería pasar después del arreglo>
```
