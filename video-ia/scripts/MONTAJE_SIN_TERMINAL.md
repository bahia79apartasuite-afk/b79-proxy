# El mismo montaje en CapCut o Premiere

`scripts/montage.sh` hace todo por linea de comandos. Si prefieres montar a mano, esto es lo
mismo paso a paso. **La shotlist manda igual**: `analysis/<video>/shotlist.md` dice el orden y
la duracion de cada plano, y el montaje solo lo ejecuta.

## Antes de abrir nada

Ten los clips y las imagenes nombrados **con el numero de plano delante**:

```
clips/01_macro-hamburguesa.mp4
clips/02_macro-vaso.mp4
stills/10_impacto.png
```

Asi el orden alfabetico es el orden del montaje y no tienes que pensarlo dos veces.
`tools/generar_lista_montaje.py` te da la lista con los nombres ya puestos.

## 1. Proyecto

- **Resolucion** 1920×1080 (o 1280×720 si vas a publicar solo en redes)
- **Fotogramas por segundo** 30
- **Duracion** la que diga tu shotlist

En CapCut: nuevo proyecto → Ajustes → 16:9, 30 fps.
En Premiere: Secuencia nueva → Ajuste personalizado → 1920×1080, 30 fps, píxeles cuadrados.

## 2. Poner los clips en orden

Arrastra los clips a la pista de video en orden numerico. **No los recortes todavia.**

## 3. Recortar cada plano a su duracion

Esta es la parte que la gente hace mal. Cada clip generado dura 4 segundos o mas, y tu plano
dura 1,03. **No cortes el principio del clip: corta el centro.**

Los primeros frames de un clip generado casi siempre arrancan con un titubeo — la imagen se
asienta durante 5 o 10 frames antes de que el movimiento sea limpio. Entra despues de eso.

| En la shotlist pone | Lo que haces |
|---|---|
| plano 07, 1.03 s | del clip de 4 s, te quedas de 1.48 s a 2.51 s |
| plano 04, 5.77 s | del clip de 6 s, te quedas de 0.30 s a 6.07 s |

`montaje/lista_<video>.tsv` ya trae calculada la columna `inicio` de cada plano.

## 4. Los planos de 1 a 5 frames

Los planos de impacto y las onomatopeyas **no son video: son imagenes fijas**.

- En CapCut: importa el PNG, arrastralo a la linea de tiempo, y en la duracion pon el numero
  de frames exacto. CapCut trabaja en segundos: 1 frame a 30 fps es 0,03 s; 3 frames, 0,10 s.
- En Premiere: arrastra el PNG y en Ajustes → Duracion predeterminada del fotograma fijo pon
  3 fotogramas antes de importarlos todos.

**Cuatro imagenes distintas seguidas, no la misma cuatro veces.** Es lo que produce la
vibracion. Si repites el mismo PNG, se ve un fijo de 12 frames.

## 5. Los negros

Un rectangulo negro de la duracion que diga la shotlist. En CapCut, un fondo de color negro;
en Premiere, Archivo → Nuevo → Video en negro.

Ojo con la duracion: **un negro de 1 a 3 frames golpea, y uno de 10 a 25 frames separa
secuencias.** No son el mismo recurso.

## 6. La rampa de velocidad

Quieres velocidad real y de golpe camara lenta, no un ralenti uniforme.

- **CapCut:** selecciona el clip → Velocidad → Curva → Personalizar. Pon un punto al 60 % del
  clip a velocidad 1×, y el punto final a 0,4×. La curva entre los dos hace la rampa.
- **Premiere:** clic derecho en el clip → Mostrar fotogramas clave del clip → Reasignacion de
  tiempo → Velocidad. Pon un fotograma clave al 60 %, arrastra la parte derecha hacia abajo
  hasta el 40 %, y separa las dos mitades del fotograma clave para suavizar la transicion.

## 7. La onomatopeya

**La palabra es un dibujo, no una fuente.** Generala como PNG con fondo transparente y
superponla en una pista de arriba. Si usas el texto de CapCut o de Premiere con una fuente del
sistema, se nota inmediatamente y rompe el estilo.

Colocala **descentrada**, tocando un borde del cuadro, y con las letras superpuestas entre si.

## 8. Musica y ducking

1. Musica en la pista A2.
2. Voz o efectos en la A1.
3. **Ducking:** que la musica baje cuando hay voz.
   - **CapCut:** selecciona la musica → Audio → Reduccion automatica (activar). Ajusta la
     intensidad a la mitad.
   - **Premiere:** ventana Sonido esencial → marca la musica como "Musica" y la voz como
     "Dialogo" → en la musica, Ducking → Generar fotogramas clave. Reduccion −12 dB.
4. Normaliza la mezcla final a **−14 LUFS**, que es lo que piden YouTube, Instagram y TikTok.

## 9. Exportar

| Destino | Formato |
|---|---|
| YouTube, web | 1920×1080, H.264, 30 fps, 10–16 Mb/s, audio AAC 192 kb/s a 48 kHz |
| Reels, TikTok, Shorts | 1080×1920, H.264, 30 fps, 8–12 Mb/s |

Para el vertical: **no escales el 16:9 con barras negras.** Recorta el centro, o mete el 16:9
sobre una copia difuminada de si mismo. En CapCut, Formato → 9:16 y luego reencuadra plano a
plano; en Premiere, efecto Reencuadre automatico.

Reencuadrar plano a plano lleva su tiempo, pero es lo que hace que el vertical funcione: en los
planos amplios el sujeto no esta en el centro, y un recorte central automatico se lo come.

## Lo que no se puede arreglar en el montaje

Para que no pierdas el tiempo intentandolo:

- **Una cara que cambia entre planos.** Se arregla en la hoja de personaje, no aqui.
- **Un clip que ha derivado a fotorrealismo.** Se regenera.
- **Un corte que el modelo se invento dentro del clip.** Puedes cortar antes del corte, pero
  pierdes la mitad del plano. Se arregla reescribiendo la linea `ACTION` del prompt.
- **La luz de un plano que no cuadra con la del anterior.** Un grado de color lo disimula un
  poco; si la fuente esta al otro lado, no hay grado que lo salve.
