# pipeline — el sistema desde la terminal

**Estado: arquitectura preparada, sin ejecutar.** Sin `video-ia/.env` todo funciona en modo
simulacion: te dice que lanzaria y cuanto costaria, y no llama a ninguna API.

```bash
python3 -m pipeline coste   on_the_road          # estima, no lanza nada
python3 -m pipeline frames  on_the_road          # genera los start frames
python3 -m pipeline video   on_the_road          # anima los aprobados
python3 -m pipeline montage on_the_road          # llama a scripts/montage.sh
```

Solo biblioteca estandar de Python. Sin dependencias.

## Poner las claves

```bash
cp pipeline/.env.ejemplo .env
```

Rellena `FAL_KEY` como minimo. `.env` esta en `.gitignore` y **nunca se sube**. Las claves no
aparecen en `runs/log.jsonl` ni en ningun mensaje de error: cuando una peticion falla se
registra el codigo HTTP y la ruta, no el cuerpo de la respuesta, que puede llevar la clave
dentro.

## Las seis reglas, y donde estan en el codigo

| | Regla | Donde |
|---|---|---|
| 1 | No se anima sin start frame **aprobado** en `assets/frames/` | `reglas.exigir_start_frame` |
| 2 | Primero 6 s a 720p; la version larga solo si la prueba se aprobo | `reglas.exigir_prueba` |
| 3 | Seedance 2.5 es nativo 720p y no da 4K. Para 4K real, Seedance 2.0 | `reglas.comprobar_resolucion` |
| 4 | Maximo 4 trabajos a la vez, reintento con espera creciente en 429 | `reglas.limite_simultaneos`, `providers/base.Proveedor._peticion` |
| 5 | Cada trabajo se anota en `runs/log.jsonl` | `registro.Registro.anotar` |
| 6 | Presupuesto por ejecucion; si se pasa, para | `registro.Registro.comprobar_presupuesto` |

**"Aprobado" no es "existe el archivo".** El nombre del start frame tiene que estar en
`assets/frames/aprobados.txt`. Mirar una imagen y decidir si vale es un paso humano, y el
pipeline no puede saltarselo. Aprobar sin mirar es como no tener la regla.

## Proveedores

Un archivo por proveedor en `pipeline/providers/`, todos con la misma interfaz
(`generate_image`, `generate_video`, `wait`). Anadir uno nuevo no toca el resto.

| Archivo | Que hace | Estado |
|---|---|---|
| `fal.py` | Seedance 2.5 y 2.0, Nano Banana Pro, Seedream 5, Flux 2 Pro. **Una sola clave** | listo |
| `openai.py` | GPT Image 2, **solo para editar**, no para generar de cero | listo |
| `higgsfield.py` | Soul ID y Elements, via MCP. Documenta el mapeo, no reimplementa la API | mapeo |
| `byteplus.py` | ModelArk, `dreamina-seedance-2-5-260628` | reservado |

### Por que BytePlus esta vacio

Es la **ruta oficial y mas barata** para Seedance: facturas directamente contra ByteDance en
vez de pasar por un agregador. Pero requiere abrir cuenta en BytePlus y **pasar una aprobacion
previa**; no es una clave que se saca en dos minutos. Cuando la tengas, el archivo hereda de
`Proveedor` igual que `fal.py` y solo cambia una linea en `__main__.py`.

### Por que no hay Midjourney

**Midjourney no tiene API oficial y sus terminos prohiben la automatizacion.** No hay forma
legitima de meterlo aqui. Para el look pintado, `seedream_v5_pro` o `nano_banana_pro` con el
bloque de estilo dan un resultado equivalente. Midjourney se usa **a mano**, y solo para style
frames, si tu decides hacerlo.

## Que hay en runs/log.jsonl

Una linea JSON por trabajo:

```json
{"plano":"on_the_road_07_macro-llave","tipo":"video","modelo":"bytedance/seedance-2-0",
 "proveedor":"fal","prompt":"SPECS: 16:9, 4s...","parametros":{"duration":4,"resolution":"720p"},
 "coste_estimado_usd":0.288,"coste_real_usd":0.29,"archivo":"https://...","estado":"ok",
 "intentos":1,"t":1756500000.0}
```

Sirve para tres cosas: saber cuanto llevas gastado, reproducir un plano que salio bien con
exactamente los mismos parametros, y ver que prompts fallan siempre.

Si empiezas una tanda nueva y quieres que el presupuesto vuelva a cero, mueve el archivo:
`mv runs/log.jsonl runs/log-$(date +%F).jsonl`.

## Sobre los precios

`costes.py` lleva una tabla de tarifas. **Son ordenes de magnitud, no una factura.** Estan
para que el control de presupuesto tenga con que trabajar. Antes de una tanda grande,
comprueba el precio real en el panel de tu proveedor y ajusta la tabla.

## Lo que el pipeline NO hace

- **No aprueba nada por ti.** Genera, registra y para. Mirar y decidir es tuyo.
- **No monta.** `montage` llama a `scripts/montage.sh`, que es donde esta el montaje.
- **No escribe prompts.** Los lee de `prompts/<video>/##_<slug>.md`, que salen de la shotlist.
- **No sube nada a ninguna red social.**
