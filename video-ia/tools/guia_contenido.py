"""Fase 5 - el texto de la guia: los ocho pasos, los errores, el glosario y el mapa.

Se separa de generar_guia.py para que cambiar una explicacion no obligue a tocar el
generador de HTML.
"""

# ---------------------------------------------------------------- herramientas
HERRAMIENTAS = [
    ("Estilo y style frames", "Midjourney", "Seedream 5 · Nano Banana Pro",
     "A mano: no tiene API y sus terminos prohiben automatizarlo"),
    ("Imagenes y start frames", "Nano Banana Pro", "Seedream 5 Pro · Flux 2 Pro",
     "Nano Banana Pro es el mejor de los tres con texto"),
    ("Editar sin regenerar", "GPT Image 2", "Seedream 5 (is_inpaint)",
     "Variantes de hora del dia, corregir un detalle"),
    ("Consistencia de personaje", "Elements de Higgsfield", "--cref en Midjourney",
     "Elements, no Soul: ver el paso 4"),
    ("Animar", "Seedance 2.0", "Seedance 2.5 · Seedance 2.0 Mini",
     "2.0 es el unico con 4K real; 2.5 llega a 30 s"),
    ("Montar", "ffmpeg (scripts/montage.sh)", "CapCut · Premiere",
     "El montaje no necesita IA"),
]

# ---------------------------------------------------------------- mapa
MAPA_SVG = """
<svg viewBox="0 0 760 210" role="img"
     aria-label="Mapa del pipeline: guion, nombres, ubicaciones, personajes, props,
     start frames, video y montaje, en ese orden">
  <defs>
    <marker id="fl" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7"
            orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4b515c"/></marker>
    <style>
      .caja{fill:#1b1e25;stroke:#2f3540;stroke-width:1;rx:8}
      .t{fill:#e8e6e1;font:600 12px system-ui,sans-serif}
      .s{fill:#7d848f;font:10px system-ui,sans-serif}
      .n{fill:#6d737e;font:700 10px ui-monospace,monospace}
      .lin{stroke:#4b515c;stroke-width:1.4;fill:none;marker-end:url(#fl)}
      .mundo{stroke:#5B9BD5}.gente{stroke:#F2BB34}.frame{stroke:#7FB069}.fin{stroke:#E03D26}
    </style>
  </defs>

  <text class="s" x="8" y="14">1 · IDEA</text>
  <rect class="caja mundo" x="4" y="22" width="118" height="52"/>
  <text class="n" x="14" y="40">01</text><text class="t" x="34" y="40">Guion</text>
  <text class="s" x="14" y="56">3-4 frases</text>
  <text class="s" x="14" y="68">y la shotlist</text>

  <rect class="caja mundo" x="4" y="86" width="118" height="52"/>
  <text class="n" x="14" y="104">02</text><text class="t" x="34" y="104">Nombres</text>
  <text class="s" x="14" y="120">01_slug.png</text>
  <text class="s" x="14" y="132">el orden manda</text>

  <text class="s" x="166" y="14">2 · EL MUNDO</text>
  <rect class="caja mundo" x="162" y="22" width="118" height="52"/>
  <text class="n" x="172" y="40">03</text><text class="t" x="192" y="40">Ubicaciones</text>
  <text class="s" x="172" y="56">amplio, medio,</text>
  <text class="s" x="172" y="68">detalle + horas</text>

  <text class="s" x="324" y="14">3 · LA GENTE</text>
  <rect class="caja gente" x="320" y="22" width="118" height="52"/>
  <text class="n" x="330" y="40">04</text><text class="t" x="350" y="40">Personajes</text>
  <text class="s" x="330" y="56">6 planchas</text>
  <text class="s" x="330" y="68">+ Element</text>

  <rect class="caja gente" x="320" y="86" width="118" height="52"/>
  <text class="n" x="330" y="104">05</text><text class="t" x="350" y="104">Props</text>
  <text class="s" x="330" y="120">el heroe primero</text>
  <text class="s" x="330" y="132">y los macros</text>

  <text class="s" x="482" y="14">4 · LOS FRAMES</text>
  <rect class="caja frame" x="478" y="22" width="118" height="52"/>
  <text class="n" x="488" y="40">06</text><text class="t" x="508" y="40">Start frames</text>
  <text class="s" x="488" y="56">uno por plano</text>
  <text class="s" x="488" y="68">y aprobado</text>

  <text class="s" x="640" y="14">5 · EL VIDEO</text>
  <rect class="caja fin" x="636" y="22" width="118" height="52"/>
  <text class="n" x="646" y="40">07</text><text class="t" x="666" y="40">Animar</text>
  <text class="s" x="646" y="56">Seedance 2.0</text>
  <text class="s" x="646" y="68">una toma continua</text>

  <rect class="caja fin" x="636" y="86" width="118" height="52"/>
  <text class="n" x="646" y="104">08</text><text class="t" x="666" y="104">Montaje</text>
  <text class="s" x="646" y="120">ffmpeg o CapCut</text>
  <text class="s" x="646" y="132">16:9 y 9:16</text>

  <path class="lin" d="M122,48 L158,48"/>
  <path class="lin" d="M63,74 L63,86"/>
  <path class="lin" d="M280,48 L316,48"/>
  <path class="lin" d="M379,74 L379,86"/>
  <path class="lin" d="M438,48 L474,48"/>
  <path class="lin" d="M438,112 C462,112 462,60 474,52"/>
  <path class="lin" d="M596,48 L632,48"/>
  <path class="lin" d="M695,74 L695,86"/>

  <rect x="4" y="160" width="750" height="42" rx="8" fill="#14161b" stroke="#272b34"/>
  <text class="t" x="18" y="180">Cada flecha es una aprobacion, no un paso.</text>
  <text class="s" x="18" y="195">Si el anterior no esta aprobado, el siguiente hereda
  el fallo multiplicado por el numero de planos.</text>
</svg>"""

# ---------------------------------------------------------------- pasos
PASOS = [
    dict(
        id="guion", titulo="Guion y shotlist",
        resumen="Tres frases y una tabla. Sin esto no hay nada.",
        donde=["papel", "analysis/mi_video/anotaciones.json"],
        cuerpo="""
<h4>Que hago</h4>
<p>Primero el guion: <b>tres o cuatro frases</b>. Que pasa, quien lo hace, donde. Si no cabe
en cuatro frases, todavia no lo tienes claro y no es momento de generar nada.</p>
<p><code>on_the_road</code> entero cabe en una: <i>un hombre come en un diner del desierto,
se sube a su coche y se va.</i> No hay mas trama. Lo que hace que funcione es el ritmo, y el
ritmo se decide en la shotlist.</p>
<p>Despues la shotlist: <b>una fila por plano</b>, con tipo, camara, sujeto, accion y — la
columna que la gente se salta — <b>por que existe ese plano</b>. Si no sabes contestar a eso
en una frase, el plano sobra. Quitalo antes de que te cueste dinero.</p>

<h4>Los seis tipos de plano</h4>
<p>Con estos seis se construye cualquier cosa:</p>
<ul>
  <li><b>busto</b> — quien es. La cara. Es el unico encuadre donde la identidad aguanta.</li>
  <li><b>macro</b> — que toca. Un objeto de cerca. Es lo que hace que el mundo parezca real.</li>
  <li><b>amplio</b> — donde esta. El sitio entero.</li>
  <li><b>POV</b> — mete al espectador dentro. Uno cada 8 o 10 planos, no mas.</li>
  <li><b>impacto</b> — 1 a 3 frames. Vineta de comic, smear, o negro.</li>
  <li><b>titulo</b> — la palabra. Onomatopeya o rotulo.</li>
</ul>

<h4>La celula que se repite</h4>
<p>El referente usa esta figura tres veces con distinto contenido:</p>
<div class="prompt"><pre>busto (quien)  →  macro (que toca)  →  amplio (donde)  →  macro (textura)</pre>
<button class="copiar" type="button">copiar</button></div>
<p>Los planos 5-6-7-8 de <code>on_the_road</code> y los 20-21-22-23 son la misma figura con
otro decorado. No es falta de ideas: es que <b>el espectador reconoce el patron y deja de
tener que orientarse</b>, y entonces puedes acelerar.</p>

<h4>El ritmo, que es lo que de verdad decides aqui</h4>
<p>Dos formas, y las dos funcionan:</p>
<ul>
  <li><b>Acelerar sin parar</b> (<code>on_the_road</code>): 2,62 s por plano, luego 1,46,
    luego 1,03. Ni un solo tramo mas lento que el anterior.</li>
  <li><b>Alternar</b> (<code>black_sand</code>): planos de 4 y 5 segundos donde pasa la
    historia, y entre medias rafagas de cuatro vinetas en 0,3 segundos.</li>
</ul>
<p>Lo que <b>no</b> funciona es un ritmo constante. Treinta planos de 1,3 segundos seguidos
se leen como un anuncio, no como una pelicula.</p>
""",
        revisar=[
            "¿Cada plano tiene escrito <b>por que existe</b>? Si no, sobra.",
            "¿Hay algun plano cuya accion lleve &laquo;y luego&raquo;? Son dos planos.",
            "¿Hay dos amplios seguidos sin cambiar el eje? Aburre.",
            "¿Suman las duraciones lo que quieres que dure el video?",
            "¿Hay al menos un plano largo de respiro antes de cada rafaga?",
        ]),

    dict(
        id="nombres", titulo="Sistema de nombres",
        resumen="Cinco minutos ahora, tres horas de lio evitadas despues.",
        donde=["terminal", "tu carpeta"],
        cuerpo="""
<h4>Que hago</h4>
<p>Decidir como se llama todo <b>antes</b> de generar la primera imagen. Cuando tengas 28
planos, 6 personajes y 90 imagenes, el nombre es lo unico que te dice que es cada cosa.</p>

<div class="prompt"><pre>video-ia/
  analysis/mi_video/        shotlist y anotaciones
  characters/mi_personaje/  sheet.md + ref/ + element.txt
  locations/mi_sitio/       sheet.md + ref/
  props/mi_objeto/          sheet.md + ref/
  prompts/mi_video/         01_slug.md … 28_slug.md
  assets/frames/            mi_video_01_slug.png   ← los start frames
  clips/                    mi_video_01_slug.mp4   ← los videos
  montaje/lista_mi_video.tsv</pre>
<button class="copiar" type="button">copiar</button></div>

<h4>La regla</h4>
<p><b>Numero de plano con dos digitos, guion bajo, slug corto con guiones.</b>
<code>07_macro-llave</code>. Nunca <code>llave.png</code>, nunca <code>final_v2_bueno.png</code>.</p>
<p>Dos digitos y no uno: con un digito, el orden alfabetico pone el plano 10 antes del 2.
Con dos, <b>el orden alfabetico es el orden del montaje</b> y no tienes que pensarlo nunca mas.</p>

<h4>Y el mismo nombre en las tres carpetas</h4>
<p>El plano 7 es <code>07_macro-llave</code> en su ficha de prompt, en su start frame y en su
clip. Cuando algo falle — y va a fallar — vas a poder ver los tres archivos del mismo plano de
un vistazo. Si cada carpeta usa su propio criterio, cada fallo te cuesta diez minutos de
buscar.</p>
""",
        revisar=[
            "¿Todos los numeros de plano llevan dos digitos?",
            "¿El mismo plano se llama igual en <code>prompts/</code>, en <code>assets/frames/</code> y en <code>clips/</code>?",
            "¿Hay algun archivo con &laquo;final&raquo;, &laquo;v2&raquo; o &laquo;bueno&raquo; en el nombre? Renombralo.",
            "¿Los slugs no llevan espacios, tildes ni mayusculas?",
        ]),

    dict(
        id="ubicaciones", titulo="Ubicaciones",
        resumen="El mundo va primero. La razon es la luz.",
        donde=["Nano Banana Pro", "Seedream 5", "locations/"],
        cuerpo="""
<h4>Por que va antes que el personaje</h4>
<p>Una ubicacion define hora del dia, direccion de la luz y temperatura de color. Si generas
al personaje primero, lo generas con una luz inventada, y luego cada plano tiene su propia luz.
El resultado son planos correctos por separado que <b>no cortan entre si</b>, y eso no se
arregla en el montaje.</p>

<h4>Que hago</h4>
<p>Un bloque de descripcion inmutable por ubicacion, y tres planchas: <b>amplio</b>
(el sitio entero, define geometria y luz), <b>medio</b> (la zona que usaras de fondo en la
mayoria de planos) y <b>detalle</b> (una textura, para los insertos macro).</p>

<h4>Las tres reglas del bloque de ubicacion</h4>
<ul>
  <li><b>Cuenta las cosas.</b> <code>six stools</code> fija la geometria;
    <code>several stools</code> no fija nada.</li>
  <li><b>La luz va al final y ocupa la mitad del bloque.</b> Es lo que hace que el personaje
    encaje despues.</li>
  <li><b>Di cuantas fuentes hay y que no hay mas.</b> <code>Two light sources and no
    others</code> evita que el modelo meta un relleno suave que te destroza el contraste.</li>
</ul>

<h4>Ejemplo del referente</h4>
<p>El callejon de <code>black_sand</code>. Fijate en la ultima frase, que es la que hace todo
el trabajo:</p>
<div class="prompt"><pre>LOCATION — GREEN ALLEY: a narrow service alley between two brick buildings, both
walls painted over in flaking olive green #627B4F and acid yellow-green #8FA24A,
covered in layered spray tags scrubbed half away. A steel fire door at the far end
painted signal red #F20D0A with a lit red EXIT sign above it. Wet cracked asphalt
underfoot holding standing water that reflects the red door. Two dumpsters, a rusted
downpipe, a fire escape overhead cutting the sky into strips. Flat overcast daylight
falling straight down and bouncing off the green walls, tinting everything green.</pre>
<button class="copiar" type="button">copiar</button></div>
<p>Sin <code>bouncing off the green walls, tinting everything green</code> te salen personajes
con piel normal delante de una pared verde. Con esa frase, la luz verde entra en la piel, que
es lo que hace que el personaje pertenezca al sitio.</p>

<h4>Las variantes de hora del dia</h4>
<p>Se generan <b>editando la plancha amplia aprobada</b>, no de cero. <code>gpt_image_2</code>
o <code>seedream_v5_pro</code> con <code>is_inpaint</code>. Si generas cada hora por separado
te salen <b>tres sitios distintos</b>, no el mismo sitio a tres horas. Es un fallo silencioso:
cada imagen esta bien y el conjunto no cuadra.</p>
""",
        revisar=[
            "¿La luz viene <b>del mismo lado</b> en las tres planchas?",
            "¿La paleta cae dentro de tu <code>STYLE.md</code>? Comparala con los hex, no de memoria.",
            "¿Hay texto legible (carteles, senales)? Si no lo controlas, quitalo.",
            "¿Cuadra la geometria entre la amplia y la media? Cuenta ventanas, postes, puertas.",
            "¿Se puede poner a una persona ahi? Sin suelo claro ni escala humana, el personaje flotara.",
        ]),

    dict(
        id="personajes", titulo="Personajes",
        resumen="Un bloque de identidad y seis planchas. Aqui se gana o se pierde todo.",
        donde=["Nano Banana Pro", "Elements de Higgsfield", "characters/"],
        cuerpo="""
<h4>La regla del rostro</h4>
<div class="aviso rojo">
  <p><b>El rostro solo se mantiene consistente en busto o plano medio.</b> En cuerpo entero la
  cara ocupa un 2 % del cuadro y ningun modelo la conserva: te devuelve una cara distinta cada
  vez. No se arregla subiendo la resolucion ni pidiendo <i>same face</i>.</p>
</div>
<p>Lo que se hace en su lugar: en planos amplios la hoja de referencia aporta <b>la
silueta</b> — ropa, proporcion, peinado, color — y la cara se deja pequena, de espaldas o
tapada por el encuadre. La cara se reserva para <b>insertos de busto</b>.</p>
<p><code>on_the_road</code> tiene 5 bustos en 28 planos, y en <b>dos de esos cinco</b> la cara
aparece reflejada en un retrovisor. Ese truco merece que lo copies: enmarcar la cara dentro de
un objeto — espejo, ventanilla, pantalla, charco — te deja meter un primer plano sin gastar un
plano entero de cara, y ademas <b>el marco justifica que la imagen sea distinta</b>.</p>

<h4>El bloque de identidad inmutable</h4>
<p>Un texto de 70 a 110 palabras que se pega <b>identico, sin cambiar una coma</b>, en todos
los prompts donde salga el personaje. Ordenado de lo mas estable a lo menos: edad y
complexion → estructura de la cara → pelo → marcas distintivas → vestuario → props.</p>
<p>Y al final, siempre, una lista de <b>lo que nunca lleva</b>.</p>

<div class="prompt"><pre>CHARACTER — THE DRIVER: a Black man in his early thirties, lean build, deep warm
brown skin. Square jaw, heavy straight eyebrows, wide-set dark brown eyes with
tired lower lids, broad nose, full mouth held closed. Full black beard connected
to the moustache, trimmed short and even along the jawline. Hair hidden under a
deep navy #2C3550 six-panel cap, curved brim, worn straight, no logo and no
lettering. Single thick gold hoop earring in the left ear only. Oversized cream
#EFE7DA unlined blazer, sleeves pushed to the forearm, worn over bare chest.
Black leather watch on the left wrist.
NEVER: sunglasses, leather jacket, necklace, tattoos, visible text on clothing,
open mouth, smile.</pre>
<button class="copiar" type="button">copiar</button></div>

<p>Tres decisiones que parecen tonterias y no lo son:</p>
<ul>
  <li><code>left ear only</code> — sin el lado, el pendiente salta de oreja entre planos.</li>
  <li><code>no logo and no lettering</code> — el referente lleva un bordado en la gorra. Un
    modelo escribe mal, y un bordado ilegible es el fallo mas visible que existe.</li>
  <li><code>NEVER: … smile</code> — este personaje no sonrie en 39 segundos, y los modelos
    sonrien por defecto. La lista negativa ahorra mas reintentos que cualquier adjetivo.</li>
</ul>

<h4>Las seis planchas</h4>
<p>Busto frontal, tres cuartos, perfil, cuerpo entero y dos expresiones. <b>Mismo vestuario,
mismo fondo neutro <code>#6B6B6B</code> y misma luz plana en las seis.</b> Fondo neutro aunque
tu video sea verde acido: si la referencia lleva la luz de la escena, arrastra ese color a
todos los planos.</p>
<p>Y describe las expresiones <b>por musculos, no por emocion</b>. <i>Angry</i> le da permiso
al modelo para cambiar la cara entera; <i>brow lowered, jaw set, mouth closed</i> mueve tres
cosas y deja el resto igual.</p>

<h4>Element, no Soul</h4>
<p>Higgsfield tiene dos mecanismos y no sirven para lo mismo:</p>
<div class="tabla"><table>
<thead><tr><th></th><th>Element</th><th>Soul ID</th></tr></thead>
<tbody>
<tr><td>Que le das</td><td>1 imagen o varias</td><td>5 a 20 fotos de <b>una persona real</b></td></tr>
<tr><td>Cuanto tarda</td><td>instantaneo</td><td>unos 10 minutos de entrenamiento</td></tr>
<tr><td>Sujetos por plano</td><td>varios</td><td>uno solo</td></tr>
<tr><td>No humanos</td><td>si (props, ubicaciones)</td><td>no</td></tr>
<tr><td>Modelos de video</td><td><code>seedance_2_0</code>, Kling 3.0, Cinema Studio</td><td>ninguno</td></tr>
</tbody></table></div>
<p><b>Para este estilo, Element.</b> Soul esta hecho para clonar la cara de una persona real a
partir de fotos y solo funciona con los modelos fotorrealistas. Nuestro personaje es un dibujo
pintado, y ademas en varios planos hay dos personajes a la vez, cosa que Soul no puede.
Element es tambien el unico que funciona con Seedance 2.0, que es lo que anima.</p>
<p>Una vez creado, en el prompt escribes <code>&lt;&lt;&lt;element_id&gt;&gt;&gt;</code> y el
sistema inyecta la imagen. Puedes poner varios:
<code>&lt;&lt;&lt;A&gt;&gt;&gt; mira a &lt;&lt;&lt;B&gt;&gt;&gt; en el callejon</code>.</p>
""",
        revisar=[
            "Pon las 6 planchas juntas y <b>tapa la ropa con la mano</b>: ¿es la misma persona?",
            "¿La marca distintiva esta en el <b>mismo lado</b> en todas? Se voltea sola muy a menudo.",
            "¿La distancia entre los ojos y el ancho de mandibula son iguales en el frontal y en el 3/4?",
            "¿El color de la ropa sigue siendo el mismo hex, o ha derivado?",
            "¿Hay texto legible en la ropa? Quitalo.",
            "¿La luz es identica en las seis? Si no, no sirven de referencia.",
            "¿El bloque mide entre 70 y 110 palabras? Cuentalas.",
        ]),

    dict(
        id="props", titulo="Props",
        resumen="El 31 % del metraje. Es lo que hace que parezca produccion de verdad.",
        donde=["Nano Banana Pro", "props/"],
        cuerpo="""
<h4>El dato</h4>
<p>En <code>on_the_road</code>, <b>11 de los 28 planos son insertos macro de objetos</b>: la
hamburguesa, el vaso, la llave, el cuentarrevoluciones, la rueda tres veces, el escape, el
volante, el velocimetro. Son el 31 % del metraje.</p>
<p>Ninguno hace avanzar la historia. Y sin ellos el video no funciona.</p>
<p>Lo que hacen es dar a entender que <b>existe un mundo fisico</b>. Un coche que solo se ve
de lejos es un dibujo de un coche. Un coche del que has visto la llave entrar en el contacto,
la aguja subir y la goma de la rueda es un objeto. El espectador no lo razona, lo da por hecho.</p>
<p>Y es la parte mas barata: un macro de un objeto sobre fondo desenfocado es lo que mejor
generan todos los modelos y lo que menos reintentos necesita.</p>

<h4>Heroe o de inserto</h4>
<ul>
  <li><b>Heroe</b> si sale en mas de cinco planos. Se trata como un personaje: bloque largo,
    varias vistas, Element propio. El coche amarillo sale en 20 de 28 planos.</li>
  <li><b>De inserto</b> si sale en uno o dos. Bloque corto, una plancha, y a otra cosa.</li>
</ul>

<h4>Un prop no se genera dentro de su plano</h4>
<p>Se genera aparte, aislado, con su propia hoja. Si lo generas dentro de la escena cambia
entre plano y plano, y los tres macros de rueda tienen que ser <b>la misma rueda</b>.</p>
<p>Cuando el objeto se repite, <b>el bloque no cambia. Solo cambian el encuadre y la luz:</b></p>
<div class="tabla"><table>
<thead><tr><th>Plano</th><th>Encuadre</th><th>Que cambia</th></tr></thead>
<tbody>
<tr><td>12</td><td>quieta a ras de suelo</td><td>humo de la quemada cruzando</td></tr>
<tr><td>23</td><td>travelling pegado en movimiento</td><td>el asfalto en rafaga debajo</td></tr>
<tr><td>27</td><td>a contraluz contra el sol</td><td>los radios como silueta</td></tr>
</tbody></table></div>
<p>Esa es la diferencia entre tres planos de la misma rueda y tres ruedas distintas.</p>

<h4>Las cuatro frases que salvan un macro</h4>
<ul>
  <li><code>The face is NOT in frame.</code> — los modelos meten media cara en el borde con
    una frecuencia sorprendente.</li>
  <li><code>no readable characters</code> / <code>no brand names</code> — en cualquier
    superficie plana.</li>
  <li>La linea de desgaste: <code>dusty, stone-chipped, used</code>. Sin ella todo sale nuevo
    y de catalogo, y eso rompe el estilo pintado.</li>
  <li><code>shallow depth of field</code> + <code>out of focus behind</code> — es lo que hace
    que se lea como macro de camara y no como ilustracion de producto.</li>
</ul>

<h4>Y busca donde meter un color frio</h4>
<p>El plano 18 es una llamarada azul en el escape: <b>0,87 segundos, y es el unico color frio
de quince segundos de naranja</b>. Eso es lo que evita que el ojo se sature. Cuando montes el
tuyo, decide a proposito donde va el tuyo.</p>
""",
        revisar=[
            "¿Es <b>el mismo objeto</b> en todas las planchas? Mira las marcas de desgaste, no la forma.",
            "¿Tiene texto, logo o numeros que no controlas? Quitalos.",
            "¿Se entiende la escala? Un macro sin referencia de tamano se lee como otra cosa.",
            "¿Reacciona el material a la luz de la ubicacion donde va a aparecer?",
            "¿Has contado en cuantos planos sale antes de decidir si es heroe?",
        ]),

    dict(
        id="frames", titulo="Start frames",
        resumen="Una imagen fija por plano. Nada se anima sin esto aprobado.",
        donde=["Nano Banana Pro", "prompts/mi_video/"],
        cuerpo="""
<h4>Que es un start frame</h4>
<p>La <b>primera imagen</b> del plano, generada como imagen fija y aprobada antes de animar
nada. El modelo de video parte de ella, asi que todo lo que este mal ahi va a estar mal en el
video, y en el video cuesta cinco veces mas arreglarlo.</p>

<h4>Como se monta el prompt</h4>
<p>Siempre en este orden, y el orden importa porque los modelos pesan mas el principio:</p>
<div class="prompt"><pre>[BLOQUE DE ESTILO]        ← lo que no puede fallar, por eso va primero
[BLOQUE DE PERSONAJE]     ← solo si el personaje sale en este plano
[BLOQUE DE UBICACION]
[BLOQUE DE PROP]
[ENCUADRE Y ACCION CONGELADA]</pre>
<button class="copiar" type="button">copiar</button></div>

<h4>El bloque de estilo de los referentes</h4>
<p>Pegalo al principio de cualquier prompt de imagen y obtienes ese look. Fijate en que
<b>no nombra ninguna pelicula ni ninguna serie</b>: describe la tecnica. Nombrar una obra
concreta funciona a veces, pero te ata a material con derechos y varios modelos lo rechazan.
Describir la tecnica funciona siempre y es tuyo.</p>
{estilo_otr}
{estilo_bs}

<h4>Accion congelada, no accion</h4>
<p>El encuadre del start frame describe <b>un instante</b>, no un movimiento. No
<i>&laquo;gira la llave&raquo;</i> sino <i>&laquo;la mano sobre la llave ya metida en el
contacto&raquo;</i>. El movimiento se lo pides despues al modelo de video.</p>

<h4>Y no adjuntes referencias de mas</h4>
<div class="aviso rojo">
  <p><b>En un macro de manos u objetos, no adjuntes la referencia de la cara.</b> Cada
  referencia de mas empuja al modelo a usarla, y acabas con media cara asomando en el borde de
  un plano de una llave. Es la trampa mas cara del sistema y la comete todo el mundo.</p>
</div>
""",
        revisar=[
            "¿La paleta cae dentro de la del acto? Comparala con los hex, no de memoria.",
            "¿La luz viene del mismo lado que en el plano anterior y el siguiente?",
            "¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.",
            "¿Deja el encuadre aire para el movimiento que vas a pedir en el video?",
            "Si es busto: ¿es la misma cara que en la hoja? Ponlas lado a lado.",
            "Si es macro: ¿se cuela media cara en el borde?",
            "Si es amplio: ¿coinciden silueta y ropa? La cara ahi no se sostiene y no pasa nada.",
        ]),

    dict(
        id="video", titulo="Animar",
        resumen="Un clip por plano. Una toma continua. Nunca describas un corte.",
        donde=["Seedance 2.0", "clips/"],
        cuerpo="""
<h4>La estructura del prompt de video</h4>
<div class="prompt"><pre>SPECS: 16:9, 4s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Sheets attached as image_references.
ACTION: [una sola cosa que pasa]
CAMERA: [un termino del banco de camara]
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions.
Face and identity unchanged from the reference. Palette, brushwork and lighting
unchanged from the start frame. No text, no watermark, no logo, no subtitles.
SFX: [dos o tres sonidos concretos]</pre>
<button class="copiar" type="button">copiar</button></div>

<h4>Nunca describas un corte</h4>
<div class="aviso rojo">
  <p>Un prompt de video describe <b>UNA toma continua</b>. Si escribes <i>&laquo;el coche
  arranca y luego cortamos a la rueda&raquo;</i>, el modelo intenta hacer las dos cosas en el
  mismo clip y te devuelve una transformacion rara en medio. Los cortes se hacen en el montaje.</p>
  <p><b>Si tu frase lleva &laquo;y luego&raquo;, &laquo;despues&raquo; o
  &laquo;entonces&raquo;, son dos planos.</b> Vuelve a la shotlist y separalos.</p>
</div>

<h4>La linea GUARDRAIL no es decoracion</h4>
<p><code>single continuous shot, no cuts</code> es lo que evita que el modelo se invente un
corte a mitad del clip. <code>face and identity unchanged</code> es lo unico que sostiene la
cara a lo largo del video. Y <code>palette, brushwork and lighting unchanged</code> es lo que
frena la deriva hacia fotorrealismo, que es el fallo mas frecuente y el que no se arregla en
el montaje.</p>

<h4>Seedance no baja de 4 segundos</h4>
<p>Tu plano dura 1,03 segundos. Seedance genera minimo 4. Asi que <b>generas 4 y recortas en
el montaje</b>, y no recortas del principio: recortas del centro. Los primeros 5 o 10 frames
de un clip generado casi siempre arrancan con un titubeo mientras la imagen se asienta.</p>

<h4>Los planos de 1 a 5 frames no se animan</h4>
<p>Son <b>imagenes fijas</b>. En <code>black_sand</code> son 19 de 53 planos. Generar 4
segundos de video para usar 2 frames es tirar el dinero.</p>
<p>Y para una rafaga: genera <b>cuatro dibujos distintos</b> de la misma vineta, no la misma
imagen cuatro veces. Que cada frame sea un dibujo distinto es exactamente lo que produce la
vibracion. Alterna ademas el fondo dentro de la rafaga — blanco, rojo, blanco — porque el ojo
lo lee como un flash.</p>

<h4>Prueba corta antes de la larga</h4>
<p>6 segundos a 720p. Miras. <b>Solo entonces</b> la version larga. Un plano largo que sale
mal cuesta lo mismo que tres pruebas cortas.</p>

<h4>Resolucion</h4>
<p>Genera a <b>720p</b>. Seedance 2.5 renderiza nativo a 720p: lo que llama 1080p es un
reescalado del proveedor, no detalle nuevo. Si necesitas 4K de verdad, el unico que lo da es
Seedance 2.0. Sube la resolucion solo en el pase final de los planos que ya has aprobado.</p>
""",
        revisar=[
            "¿Hay algun corte dentro del clip? Entonces el prompt describia dos acciones.",
            "¿Se mantiene la cara hasta el final del clip, o deriva en el ultimo segundo?",
            "¿Hace la camara lo que pediste, o el modelo ha anadido un zoom por su cuenta?",
            "¿Hay suficientes segundos <b>utiles seguidos</b>, sin el titubeo del arranque?",
            "¿Se mantiene la pincelada, o ha derivado hacia fotorrealismo? Eso se regenera.",
            "¿Has generado los planos de menos de 5 frames como imagen y no como video?",
        ]),

    dict(
        id="montaje", titulo="Montaje y sonido",
        resumen="Donde el video pasa de ser 28 clips a ser una pelicula.",
        donde=["ffmpeg", "CapCut", "Premiere"],
        cuerpo="""
<h4>Que hago</h4>
<p>Concatenar en el orden de la shotlist, recortar cada plano a su duracion, meter las vinetas
como imagenes fijas de 1 a 3 frames, hacer las rampas de velocidad, superponer las
onomatopeyas y mezclar el sonido.</p>

<h4>Con terminal</h4>
<div class="prompt"><pre>python3 tools/generar_lista_montaje.py mi_video
./scripts/montage.sh --lista montaje/lista_mi_video.tsv \\
                     --musica montaje/musica.mp3 --dry-run</pre>
<button class="copiar" type="button">copiar</button></div>
<p>Quita <code>--dry-run</code> cuando la lista te convenza. Exporta 16:9 y 9:16 de una vez.</p>

<h4>Sin terminal</h4>
<p>Todo esto se hace igual en CapCut o Premiere; esta explicado paso a paso en
<code>scripts/MONTAJE_SIN_TERMINAL.md</code>. Los puntos que se hacen mal casi siempre:</p>
<ul>
  <li><b>Recorta del centro del clip, no del principio.</b></li>
  <li><b>Los negros no son todos iguales.</b> De 1 a 3 frames golpean; de 10 a 25 separan
    secuencias y hacen de elipsis temporal. No es el mismo recurso.</li>
  <li><b>La onomatopeya es un dibujo, no una fuente.</b> Genera el PNG con fondo transparente
    y superponlo. Si usas el texto de CapCut con una fuente del sistema, se nota
    inmediatamente. Y ponla <b>descentrada</b>, tocando un borde, con las letras superpuestas.</li>
  <li><b>La rampa de velocidad</b> es velocidad real hasta el 60 % del clip y de golpe 0,4x,
    no un ralenti uniforme.</li>
</ul>

<h4>Sonido</h4>
<p>Musica en una pista, voz o efectos en otra, y <b>ducking</b>: que la musica baje cuando hay
voz. En CapCut es &laquo;Reduccion automatica&raquo;; en Premiere, Sonido esencial &rarr;
Ducking. Normaliza la mezcla final a <b>&minus;14 LUFS</b>, que es lo que piden YouTube,
Instagram y TikTok.</p>

<h4>Para el vertical, no escales con barras</h4>
<p>Recorta el centro, o mete el 16:9 sobre una copia difuminada de si mismo. Y si tienes
tiempo, <b>reencuadra plano a plano</b>: en los planos amplios el sujeto no esta en el centro,
y un recorte central automatico se lo come.</p>

<div class="aviso rojo">
  <p><b>Lo que no se arregla aqui:</b> una cara que cambia entre planos (se arregla en la hoja
  de personaje), un clip que ha derivado a fotorrealismo (se regenera), un corte que el modelo
  se invento dentro del clip (se reescribe la linea <code>ACTION</code>), y la luz de un plano
  que viene del lado contrario que la del anterior. Un grado de color disimula un poco; si la
  fuente esta al otro lado, no hay grado que lo salve.</p>
</div>
""",
        revisar=[
            "¿Suma el montaje la duracion que decia la shotlist?",
            "¿Entra cada plano <b>despues</b> del titubeo inicial de su clip?",
            "¿Son las cuatro vinetas de una rafaga cuatro dibujos distintos, o el mismo repetido?",
            "¿Esta la mezcla a &minus;14 LUFS?",
            "¿Funciona el vertical, o el recorte central se come al sujeto en los amplios?",
            "Ve el video entero <b>con sonido y a tamano completo</b>. Es el unico test que cuenta.",
        ]),
]

# ---------------------------------------------------------------- errores
ERRORES = [
    ("Texto en la ropa que no se lee",
     "Un bordado, un logo o unas letras en una camiseta que en cada plano dicen algo "
     "distinto y en ninguno dicen nada.",
     "Los modelos de imagen escriben mal. Si el prompt menciona texto, o si la referencia "
     "lleva texto, el modelo lo intenta y falla, y falla distinto cada vez.",
     "Pon <code>no logo and no lettering</code> en el bloque de identidad. Si el texto es "
     "necesario para la historia, hazlo <b>deliberadamente ilegible</b>: pequeno, borroso, "
     "cortado por el encuadre. Un modelo si sabe hacer eso. O ponlo en el montaje."),

    ("La cara cambia en cuerpo entero",
     "El personaje es reconocible en los bustos y en los planos amplios es otra persona.",
     "En cuerpo entero la cara ocupa un 2 % del cuadro. No hay resolucion ni referencia que "
     "lo arregle: no es un fallo, es una limitacion.",
     "<b>Deja de intentarlo.</b> En amplios, que la referencia aporte solo la silueta y que "
     "el encuadre no muestre la cara de cerca: de espaldas, de perfil lejano, en sombra. "
     "Reserva la cara para bustos. Y usa el truco del retrovisor: enmarcar la cara dentro de "
     "un espejo o una ventanilla te deja un primer plano barato y consistente."),

    ("Describir cortes dentro de un prompt de video",
     "El clip hace una cosa, y a mitad se transforma en otra con un fundido raro en medio.",
     "El prompt describia dos acciones: &laquo;arranca <b>y luego</b> sale&raquo;. El modelo "
     "intenta hacer las dos en una sola toma.",
     "Una accion por plano. Si tu frase lleva &laquo;y luego&raquo;, &laquo;despues&raquo; o "
     "&laquo;entonces&raquo;, son dos planos: vuelve a la shotlist y separalos. Y deja "
     "<code>single continuous shot, no cuts</code> en la linea GUARDRAIL siempre."),

    ("Animar sin start frame",
     "Cada plano tiene su propio estilo, su propia paleta y su propia luz. Por separado estan "
     "bien; juntos no parecen la misma pelicula.",
     "Sin start frame, el modelo de video inventa el encuadre, la luz y el color desde cero "
     "en cada plano.",
     "Nunca animes sin un start frame <b>aprobado</b>. Es la regla dura del sistema y el "
     "pipeline la impone: si el start frame no esta en "
     "<code>assets/frames/aprobados.txt</code>, se niega a lanzar el video."),

    ("Grado de color distinto entre planos",
     "Dos planos correctos que, uno detras de otro, dan un salto. Normalmente cambia el "
     "calor de la imagen o el lado del que viene la luz.",
     "Se genero cada plano por separado sin fijar la luz en el bloque de ubicacion, o se "
     "generaron variantes de hora del dia desde cero en vez de editando la plancha aprobada.",
     "Mete la frase de luz en el <b>bloque de ubicacion</b>, no en el prompt de cada plano, y "
     "genera las variantes de hora <b>editando</b> la plancha amplia aprobada. Un grado de "
     "color al final disimula diferencias pequenas; si la luz viene del lado contrario, no "
     "hay grado que lo salve y hay que regenerar."),

    ("Saturar de referencias",
     "Un macro de una llave donde asoma media cara en el borde. Un plano de botas donde "
     "aparece un coche que no venia a cuento.",
     "Se adjuntaron todas las referencias del proyecto a todos los planos. Cada referencia "
     "empuja al modelo a usarla.",
     "<b>Adjunta solo lo que sale en ese plano.</b> En insertos macro donde el personaje no "
     "aparece, no pongas su referencia. Y anade <code>The face is NOT in frame.</code> al "
     "encuadre: decir lo que <b>excluye</b> un encuadre funciona mejor que decir lo que incluye."),

    ("Ritmo constante",
     "Treinta planos de 1,3 segundos seguidos. Se ve como un anuncio, no como una pelicula, y "
     "a los veinte segundos deja de importar lo que pasa.",
     "Se decidio una duracion &laquo;que queda bien&raquo; y se aplico a todo.",
     "O aceleras sin parar (<code>on_the_road</code>: 2,62 &rarr; 1,46 &rarr; 1,03 segundos "
     "por plano) o alternas planos largos con rafagas (<code>black_sand</code>). Y en los dos "
     "casos, <b>mete un plano largo de respiro antes de cada rafaga</b>: sin el, la rafaga no "
     "golpea, agota."),
]

# ---------------------------------------------------------------- glosario
GLOSARIO = [
    # camara y montaje
    ("plano", "Camara", "Un trozo de video sin cortes. La unidad con la que se trabaja."),
    ("busto", "Camara", "Encuadre de cabeza y hombros. El unico donde la cara aguanta igual "
     "entre planos."),
    ("plano medio", "Camara", "De la cintura para arriba."),
    ("plano amplio / general", "Camara", "El sitio entero. Sirve para orientar al espectador."),
    ("macro / inserto", "Camara", "Un objeto muy de cerca. En los referentes son un tercio "
     "del metraje."),
    ("POV", "Camara", "<i>Point of view.</i> La camara son los ojos del personaje."),
    ("cenital", "Camara", "Desde arriba, mirando hacia abajo."),
    ("contrapicado", "Camara", "Desde abajo mirando hacia arriba. Hace que el sujeto domine."),
    ("dolly", "Camara", "La camara avanza o retrocede fisicamente. No es un zoom."),
    ("travelling / tracking", "Camara", "La camara se desplaza acompanando al sujeto."),
    ("pan", "Camara", "La camara gira sobre su eje sin moverse de sitio."),
    ("tilt", "Camara", "Como el pan, pero en vertical."),
    ("whip pan", "Camara", "Barrido tan rapido que la imagen se borra. Sirve de corte."),
    ("crash zoom", "Camara", "Zoom brutal en menos de medio segundo. Gastalo una vez."),
    ("speed ramp", "Montaje", "Velocidad normal que de golpe pasa a camara lenta."),
    ("smear", "Montaje", "Borron de movimiento dibujado a proposito, tipico de animacion."),
    ("vineta", "Montaje", "Un frame de estilo comic insertado en medio de la accion."),
    ("onomatopeya", "Montaje", "La palabra dibujada: KRAK, KRACK. En este estilo nunca es "
     "una fuente del sistema."),
    ("negro de puntuacion", "Montaje", "Frames en negro entre planos. Cortos golpean; largos "
     "separan secuencias."),
    ("ducking", "Montaje", "Que la musica baje automaticamente cuando hay voz."),
    ("LUFS", "Montaje", "Medida de volumen percibido. Las redes piden &minus;14 LUFS."),
    ("16:9 / 9:16", "Montaje", "Horizontal (YouTube) y vertical (Reels, TikTok, Shorts)."),

    # IA
    ("prompt", "IA", "El texto que le das al modelo para que genere algo."),
    ("start frame", "IA", "La primera imagen de un plano, generada aparte y aprobada antes "
     "de animar. La base de todo el sistema."),
    ("bloque de estilo", "IA", "Un texto de 60 a 90 palabras que describe el look y se pega "
     "al principio de todos los prompts de imagen."),
    ("bloque de identidad", "IA", "El texto de 70 a 110 palabras que describe a un personaje "
     "y se pega identico en todos sus prompts."),
    ("Element", "IA", "En Higgsfield, una referencia reutilizable de personaje, ubicacion o "
     "prop. Se invoca en el prompt con <code>&lt;&lt;&lt;id&gt;&gt;&gt;</code>."),
    ("Soul ID", "IA", "Entrenamiento con 5 a 20 fotos de una persona real. Solo un sujeto y "
     "solo modelos fotorrealistas. <b>No es lo que necesitas aqui.</b>"),
    ("image reference", "IA", "Una imagen que se adjunta al prompt para que el modelo la "
     "imite. Adjuntar de mas hace dano."),
    ("seed", "IA", "Numero que fija el azar. Con la misma seed y el mismo prompt sale lo mismo."),
    ("inpaint", "IA", "Editar una parte de una imagen dejando el resto intacto."),
    ("upscale", "IA", "Agrandar una imagen o un video ya generado. <b>No anade detalle real.</b>"),
    ("resolucion nativa", "IA", "La resolucion a la que el modelo genera de verdad. Por "
     "encima, lo que te da es un upscale."),
    ("deriva", "IA", "Cuando el resultado se aleja poco a poco de la referencia a lo largo de "
     "un clip o de una serie de planos."),
    ("guardrail", "IA", "La parte del prompt que dice lo que <b>no</b> puede pasar."),
    ("t2v / i2v", "IA", "<i>Text to video</i> (solo texto) y <i>image to video</i> (parte de "
     "una imagen). Aqui siempre i2v."),
    ("credito", "IA", "La moneda de los proveedores. Lo que cuesta cada generacion."),
]

# ---------------------------------------------------------------- formulario
PLANTILLAS_FORM = [
    ("1 · Bloque de identidad — pegalo en todos los prompts de este personaje",
     "CHARACTER — {{nombre}}: {{edad}}, {{piel}}. {{cara}}. {{pelo}}. {{marca}}. "
     "{{ropa}}.\nNEVER: {{nunca}}."),

    ("2 · Hoja de referencia — busto frontal",
     "{{estilo}}\n\n"
     "CHARACTER — {{nombre}}: {{edad}}, {{piel}}. {{cara}}. {{pelo}}. {{marca}}. "
     "{{ropa}}.\nNEVER: {{nunca}}.\n\n"
     "Front-facing bust portrait, head and shoulders, eyes level with the lens, neutral\n"
     "expression, looking straight into camera. Even soft key light from front-left, flat\n"
     "mid-grey #6B6B6B seamless background, no props, no scenery. Character reference\n"
     "sheet plate. 4:3."),

    ("3 · Hoja de referencia — perfil",
     "{{estilo}}\n\n"
     "CHARACTER — {{nombre}}: {{edad}}, {{piel}}. {{cara}}. {{pelo}}. {{marca}}. "
     "{{ropa}}.\nNEVER: {{nunca}}.\n\n"
     "Full profile bust portrait, head at exactly 90 degrees to camera-left, neutral\n"
     "expression, {{marca}} clearly readable on the camera side. Same lighting and same\n"
     "flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3."),

    ("4 · Start frame de un plano",
     "{{estilo}}\n\n"
     "CHARACTER — {{nombre}}: {{edad}}, {{piel}}. {{cara}}. {{pelo}}. {{marca}}. "
     "{{ropa}}.\nNEVER: {{nunca}}.\n\n"
     "{{ubicacion}}\n\n"
     "Bust portrait of {{nombre}} in the location above, the moment frozen mid-action:\n"
     "{{accion}}. Shallow depth of field, the background out of focus. 16:9."),

    ("5 · Prompt de video para Seedance 2.0",
     "SPECS: 16:9, 4s, 720p, painted 2D animation, one continuous take.\n"
     "REFERENCES: start frame attached as start_image. Character sheet of {{nombre}}\n"
     "attached as image_reference.\n"
     "ACTION: {{accion}}. One single continuous movement, nothing else happens.\n"
     "CAMERA: {{camara}}.\n"
     "GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions.\n"
     "Face and identity unchanged from the reference. Palette, brushwork and lighting\n"
     "unchanged from the start frame. No text, no watermark, no logo, no subtitles.\n"
     "SFX: [dos o tres sonidos concretos]."),
]
