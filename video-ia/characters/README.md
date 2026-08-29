# Personajes — como se mantiene una cara igual en 30 planos

## Por que existe esta carpeta

El error numero uno de un video de IA es que el personaje cambia de cara entre plano y plano.
No se arregla escribiendo mejor cada prompt: se arregla teniendo **un solo texto de identidad**
que se pega, palabra por palabra, en todos los prompts, y **una hoja de referencia** de imagenes
que se adjunta como referencia visual.

Una carpeta por personaje. Dentro, siempre lo mismo:

```
characters/<personaje>/
  sheet.md          identidad inmutable + prompts de la hoja de referencia
  ref/              las 6 imagenes aprobadas (las generas tu, este repo no genera nada)
  element.txt       el id del Element de Higgsfield, cuando lo tengas
```

## Aviso sobre los personajes de ejemplo

`el_conductor`, `el_arenero` y `el_jefe` **no son** los personajes de los videos de referencia.
Son arquetipos reconstruidos a partir del analisis, con los rasgos identificativos cambiados a
proposito (otro peinado, otra ropa, ningun texto de marca). Sirven para ensenar el metodo con un
ejemplo completo. Los disenos de los videos originales son de sus autores; copiarlos rasgo por
rasgo no es lo que quieres hacer, ni te sirve: lo que te sirve es el metodo.

## La regla del rostro (la mas importante de todo el sistema)

**El rostro solo se mantiene consistente en busto o plano medio.**

En cuerpo entero, la cara ocupa un 2 % del cuadro. Ningun modelo de imagen, ninguno, conserva
la identidad ahi: te devuelve una cara distinta cada vez y ademas mal dibujada. Intentar
arreglarlo subiendo la resolucion o pidiendo "same face" no funciona.

Lo que se hace en su lugar:

1. En **cuerpo entero y planos amplios**, la hoja de referencia se usa para la **silueta**:
   ropa, proporcion, peinado, color. La cara se deja pequena y en sombra, de espaldas, de
   perfil lejano o tapada por el encuadre.
2. La cara se reserva para **insertos de busto**, donde si se sostiene.
3. Se alterna. Amplio (silueta) → busto (cara) → macro (detalle). Es exactamente lo que hacen
   los dos videos de referencia: `on_the_road` tiene 5 bustos en 28 planos, y en 2 de esos 5 la
   cara aparece **reflejada en un retrovisor**, o sea enmarcada y pequena.

El truco del retrovisor merece un parrafo aparte: enmarcar la cara dentro de un objeto (espejo,
ventanilla, pantalla, charco) te deja meter un primer plano sin gastar un plano entero de cara,
y ademas el marco justifica que la imagen sea distinta.

## Element o Soul: cual de los dos

Higgsfield tiene dos mecanismos y no sirven para lo mismo. Esto viene de la documentacion del
propio servidor, no de suposiciones:

| | **Element** | **Soul ID** |
|---|---|---|
| Que le das | 1 imagen (o varias) | 5 a 20 fotos de **una persona real** |
| Cuanto tarda | instantaneo | unos 10 minutos de entrenamiento |
| Cuantos sujetos | varios en el mismo plano | uno solo |
| Sujetos no humanos | si (props, ubicaciones) | no |
| Modelos de imagen | `nano_banana_pro`, `nano_banana_2`, `gpt_image_2`, `seedream_v4_5`, `seedream_v5_lite`, `cinematic_studio_2_5` | Soul V2 y Cinema, y solo esos |
| Modelos de video | `seedance_2_0`, Kling 3.0, Cinema Studio Video 2 / 3.0 | no |

**Para este estilo usa Element, no Soul.** Soul esta hecho para clonar la cara de una persona
real a partir de fotos, y solo funciona con los modelos fotorrealistas. Nuestro personaje es
un dibujo pintado y ademas hay mas de uno en varios planos. Element es el camino, y ademas es
el unico que funciona con Seedance 2.0, que es lo que anima.

Elements tambien vale para **ubicaciones y props**, no solo para caras. Es la misma herramienta.

### Como crear el Element

1. Genera la hoja de referencia con los prompts de `sheet.md` hasta que las 6 imagenes te
   convenzan. **No sigas hasta que te convenzan.** Todo lo que venga despues hereda esto.
2. Subes las imagenes aprobadas: `media_upload` → PUT de los bytes → `media_confirm`.
3. Creas el Element: `show_reference_elements` con `action: "create"`, las `medias` y un `name`
   corto (maximo 32 caracteres, los espacios se convierten en guiones).
4. Te devuelve un `element_id`. **Lo guardas en `characters/<personaje>/element.txt`.**
5. A partir de ahi, en cualquier prompt de imagen o de video escribes `<<<element_id>>>` dentro
   del texto y el sistema inyecta la imagen solo. Puedes poner varios en el mismo prompt:
   `"<<<UUID_A>>> mira a <<<UUID_B>>> en el callejon"`.

Si no usas Higgsfield sino Midjourney a mano, el equivalente es `--cref <url>` con la imagen de
busto, o adjuntar la hoja como referencia en GPT Image 2 y pedir edicion en vez de generacion.

## Anatomia del bloque de identidad inmutable

Cada `sheet.md` empieza con un bloque que **se pega entero, sin cambiar una coma**, en todos los
prompts donde salga el personaje. Esta ordenado de lo mas estable a lo menos:

1. **Edad, complexion, tono de piel.** Lo que nunca cambia.
2. **Estructura de la cara.** Forma de mandibula, cejas, nariz, boca. Aqui es donde se gana o
   se pierde la consistencia.
3. **Pelo.** Corte exacto, no "pelo corto".
4. **Marcas distintivas.** Cicatriz, piercing, lunar, tatuaje. Una o dos, no seis: el modelo
   solo retiene las primeras.
5. **Vestuario.** Prenda, color con hex, corte.
6. **Props que lleva encima.**

Y despues, siempre, una lista de **lo que nunca lleva**. Un modelo de imagen anade cosas por su
cuenta (gafas de sol, chaquetas de cuero, cadenas); decir "no sunglasses, no leather jacket"
ahorra mas reintentos que cualquier adjetivo positivo.

Entre 70 y 110 palabras. Mas corto no fija; mas largo se diluye y el modelo empieza a ignorar
el final del bloque.

## Que revisar antes de aprobar una hoja de referencia

Pon las 6 imagenes juntas en una cuadricula y mira, en este orden:

- [ ] ¿Es **la misma persona** en las 6? Tapa la ropa con la mano y compara solo las caras.
- [ ] ¿La distancia entre los ojos y el ancho de la mandibula son iguales en el frontal y en el 3/4?
- [ ] ¿La marca distintiva esta en **el mismo lado** en todas? (Se voltea sola con muchisima frecuencia.)
- [ ] ¿El color de la ropa es el mismo hex, o ha derivado hacia otro tono?
- [ ] ¿Hay texto legible en la ropa? Si lo hay, quitalo. Es el fallo mas visible de todos.
- [ ] ¿La luz es la misma en las 6? Si no, no sirven como referencia: la referencia debe ser neutra.

Si falla cualquiera de estos, se vuelve a generar la hoja. **No se sigue adelante.** Un fallo
aqui se multiplica por los 28 planos que vienen despues.
