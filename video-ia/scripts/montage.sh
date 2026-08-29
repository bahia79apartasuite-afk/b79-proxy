#!/usr/bin/env bash
# montage.sh - monta el video final a partir de los clips generados, en el orden de la shotlist.
#
#   ./scripts/montage.sh --lista montaje/lista.tsv --musica montaje/musica.mp3 --dry-run
#
# Hace: concatenar en orden, insertar vinetas de 1-5 frames, rampas de velocidad, overlays de
# onomatopeya, mezcla de musica con ducking, y exporta 16:9 y 9:16.
#
# No genera nada con IA. Solo ffmpeg sobre archivos que ya tienes.
set -euo pipefail

# ---------------------------------------------------------------- utilidades
rojo()  { printf '\033[31m%s\033[0m\n' "$*" >&2; }
info()  { printf '\033[36m%s\033[0m\n' "$*" >&2; }
morir() { rojo "ERROR: $*"; exit 1; }

# ffmpeg: el del sistema, o el que trae imageio-ffmpeg si no hay otro
buscar_ffmpeg() {
  if [ -n "${FFMPEG:-}" ]; then echo "$FFMPEG"; return; fi
  if command -v ffmpeg >/dev/null 2>&1; then command -v ffmpeg; return; fi
  python3 -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null \
    || morir "no encuentro ffmpeg. Instalalo, o 'pip install imageio-ffmpeg'."
}

# ---------------------------------------------------------------- parametros
LISTA="montaje/lista.tsv"
MUSICA=""
VOZ=""
SALIDA="salida"
ANCHO=1280; ALTO=720; FPS=30
VERTICAL="recorte"          # recorte | difuminado
DUCK_DB=12                  # cuanto baja la musica bajo la voz
DRY=0
SOLO_HORIZONTAL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --lista)     LISTA="$2"; shift 2 ;;
    --musica)    MUSICA="$2"; shift 2 ;;
    --voz)       VOZ="$2"; shift 2 ;;
    --salida)    SALIDA="$2"; shift 2 ;;
    --fps)       FPS="$2"; shift 2 ;;
    --ancho)     ANCHO="$2"; shift 2 ;;
    --alto)      ALTO="$2"; shift 2 ;;
    --vertical)  VERTICAL="$2"; shift 2 ;;
    --duck)      DUCK_DB="$2"; shift 2 ;;
    --solo-16-9) SOLO_HORIZONTAL=1; shift ;;
    --dry-run|-n) DRY=1; shift ;;
    -h|--help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
      cat <<'AYUDA'

Opciones
  --lista RUTA      manifiesto TSV del montaje        (por defecto montaje/lista.tsv)
  --musica RUTA     pista de musica
  --voz RUTA        voz o cama de efectos; la musica se agacha debajo
  --salida DIR      carpeta de salida                 (por defecto salida/)
  --fps N           fotogramas por segundo            (30)
  --ancho / --alto  resolucion horizontal             (1280x720)
  --vertical MODO   recorte | difuminado              (recorte)
  --duck DB         cuanto baja la musica bajo la voz (12)
  --solo-16-9       no exportar la version vertical
  --dry-run, -n     imprime los comandos y no ejecuta nada

Formato del manifiesto (TSV, tabulaciones, # para comentarios)
  tipo    archivo                       inicio  duracion  opciones
  clip    clips/01_hamburguesa.mp4      0.60    2.23
  clip    clips/03_busto.mp4            0.80    1.63      texto=;
  fija    stills/impacto_a.png          -       0.10
  fija    stills/krak_1.png             -       0.10      texto=KRAK!
  rampa   clips/27_rueda.mp4            1.00    2.13      factor=0.4,punto=0.6
  negro   -                             -       0.30

  inicio    segundo del archivo de origen donde empieza el recorte ('-' en fija y negro)
  duracion  segundos que dura en el montaje final
  opciones  pares clave=valor separados por comas:
              rotulo=RUTA.png  superpone el PNG de la onomatopeya (LA VIA BUENA:
                               en este estilo la palabra es un dibujo, no una fuente)
              escala=0.8       ancho del rotulo como fraccion del cuadro
              texto=PALABRA    apano rapido con drawtext y la fuente del sistema;
                               requiere un ffmpeg compilado con libfreetype
              factor=0.4       velocidad de la parte lenta de una rampa
              punto=0.6        en que fraccion del clip empieza a frenar
AYUDA
      exit 0 ;;
    *) morir "opcion desconocida: $1 (prueba --help)" ;;
  esac
done

FF="$(buscar_ffmpeg)"
[ -f "$LISTA" ] || morir "no existe el manifiesto: $LISTA"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Duracion de un archivo en segundos. Se usa para cortar la mezcla de audio con -t exacto:
# '-shortest' junto con '-c:v copy' trunca el video antes de tiempo (probado: 5.65 s -> 4.77 s).
duracion_de() {
  # 'ffmpeg -i archivo' sin salida termina con codigo 1 a proposito, asi que se aisla
  # del set -e y del pipefail o el script se muere aqui.
  local info
  info="$("$FF" -hide_banner -i "$1" 2>&1 || true)"
  printf '%s\n' "$info" \
    | awk -F'[:,]' '/Duration:/ {printf "%.3f", $2*3600+$3*60+$4; exit}'
}

correr() {
  if [ "$DRY" = 1 ]; then
    printf '%s\n\n' "$*" ;
  else
    "$@" </dev/null
  fi
}

# ---------------------------------------------------------------- un segmento
# Cada fila del manifiesto se normaliza a un archivo suelto: misma resolucion, mismo fps,
# mismo pixel format y una pista de audio muda. Concatenar cosas heterogeneas es de donde
# vienen casi todos los fallos de ffmpeg, asi que se normaliza antes y no despues.
ESCALA="scale=${ANCHO}:${ALTO}:force_original_aspect_ratio=decrease,pad=${ANCHO}:${ALTO}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS},format=yuv420p"

# drawtext necesita que ffmpeg venga con libfreetype. Varios binarios estaticos no lo traen
# (el de imageio-ffmpeg, por ejemplo), asi que se comprueba una vez y se avisa.
if "$FF" -hide_banner -filters 2>/dev/null | grep -q ' drawtext '; then
  TIENE_DRAWTEXT=1
else
  TIENE_DRAWTEXT=0
fi

texto_filtro() {  # $1 = palabra
  local palabra="${1//:/\\:}"
  palabra="${palabra//\'/}"
  printf "drawtext=text='%s':fontcolor=white:fontsize=h/5:borderw=h/90:bordercolor=black:x=(w-text_w)/2+w*0.04:y=(h-text_h)/2:box=0" "$palabra"
}

# Superpone el PNG de una onomatopeya. Es la via buena: en este estilo la palabra es un dibujo,
# no una fuente del sistema, asi que lo normal es generarla como imagen con fondo transparente
# y pegarla aqui. 'texto=' con drawtext queda como apano rapido para maquetar.
poner_rotulo() {  # $1 = video, $2 = png, $3 = escala (0-1 del ancho), $4 = destino
  correr "$FF" -hide_banner -loglevel error -y -i "$1" -i "$2" \
    -filter_complex "[1:v]scale=iw*${ANCHO}*${3}/iw:-1[rot];[0:v][rot]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[vout]" \
    -map "[vout]" -map 0:a? -c:v libx264 -preset medium -crf 17 -c:a copy "$4"
}

n=0
LISTA_CONCAT="$TMP/concat.txt"
: > "$LISTA_CONCAT"

while IFS=$'\t' read -r tipo archivo inicio duracion opciones || [ -n "$tipo" ]; do
  case "$tipo" in ''|\#*) continue ;; esac
  n=$((n+1))
  seg="$TMP/seg_$(printf '%03d' "$n").mp4"
  opciones="${opciones:-}"

  # opciones
  texto=""; factor="0.4"; punto="0.6"; rotulo=""; escala="0.8"
  IFS=',' read -ra pares <<< "$opciones"
  for par in "${pares[@]}"; do
    case "$par" in
      texto=*)  texto="${par#texto=}" ;;
      factor=*) factor="${par#factor=}" ;;
      punto=*)  punto="${par#punto=}" ;;
      rotulo=*) rotulo="${par#rotulo=}" ;;
      escala=*) escala="${par#escala=}" ;;
    esac
  done

  vf="$ESCALA"
  if [ -n "$texto" ]; then
    if [ "$TIENE_DRAWTEXT" = 1 ]; then
      vf="$vf,$(texto_filtro "$texto")"
    else
      rojo "aviso fila $n: este ffmpeg no trae drawtext, se ignora texto=$texto."
      rojo "                usa rotulo=ruta.png, que ademas es lo correcto para este estilo."
      texto=""
    fi
  fi

  case "$tipo" in
    clip)
      [ -f "$archivo" ] || morir "fila $n: no existe $archivo"
      info "[$n] clip   ${duracion}s  $archivo (desde ${inicio}s)"
      correr "$FF" -hide_banner -loglevel error -y \
        -ss "$inicio" -t "$duracion" -i "$archivo" \
        -f lavfi -t "$duracion" -i anullsrc=channel_layout=stereo:sample_rate=48000 \
        -filter:v "$vf" -map 0:v:0 -map 1:a:0 \
        -c:v libx264 -preset medium -crf 17 -c:a aac -shortest "$seg"
      ;;
    fija)
      [ -f "$archivo" ] || morir "fila $n: no existe $archivo"
      info "[$n] fija   ${duracion}s  $archivo${texto:+  texto=$texto}"
      correr "$FF" -hide_banner -loglevel error -y \
        -loop 1 -t "$duracion" -i "$archivo" \
        -f lavfi -t "$duracion" -i anullsrc=channel_layout=stereo:sample_rate=48000 \
        -filter:v "$vf" -map 0:v:0 -map 1:a:0 \
        -c:v libx264 -preset medium -crf 17 -c:a aac -shortest "$seg"
      ;;
    negro)
      info "[$n] negro  ${duracion}s"
      correr "$FF" -hide_banner -loglevel error -y \
        -f lavfi -t "$duracion" -i "color=c=black:s=${ANCHO}x${ALTO}:r=${FPS}" \
        -f lavfi -t "$duracion" -i anullsrc=channel_layout=stereo:sample_rate=48000 \
        -filter:v "format=yuv420p,setsar=1" -map 0:v:0 -map 1:a:0 \
        -c:v libx264 -preset medium -crf 17 -c:a aac -shortest "$seg"
      ;;
    rampa)
      # Velocidad real hasta 'punto' y camara lenta a partir de ahi. Se parte el clip en dos
      # trozos, se estira el segundo con setpts y se concatenan. La duracion final es mayor
      # que la de origen: es lo que hace que el golpe pese.
      [ -f "$archivo" ] || morir "fila $n: no existe $archivo"
      corte=$(awk -v d="$duracion" -v p="$punto" 'BEGIN{printf "%.3f", d*p}')
      resto=$(awk -v d="$duracion" -v c="$corte" 'BEGIN{printf "%.3f", d-c}')
      final=$(awk -v c="$corte" -v r="$resto" -v f="$factor" 'BEGIN{printf "%.2f", c+r/f}')
      info "[$n] rampa  ${duracion}s de origen -> ${final}s (x${factor} desde ${punto})"
      correr "$FF" -hide_banner -loglevel error -y \
        -ss "$inicio" -t "$duracion" -i "$archivo" \
        -f lavfi -t "$final" -i anullsrc=channel_layout=stereo:sample_rate=48000 \
        -filter_complex \
          "[0:v]${ESCALA}[base];\
           [base]split=2[a][b];\
           [a]trim=0:${corte},setpts=PTS-STARTPTS[v1];\
           [b]trim=${corte}:${duracion},setpts=(PTS-STARTPTS)/${factor}[v2];\
           [v1][v2]concat=n=2:v=1:a=0${texto:+,$(texto_filtro "$texto")}[vout]" \
        -map "[vout]" -map 1:a:0 \
        -c:v libx264 -preset medium -crf 17 -c:a aac -shortest "$seg"
      ;;
    *) morir "fila $n: tipo desconocido '$tipo'" ;;
  esac
  if [ -n "$rotulo" ]; then
    [ -f "$rotulo" ] || morir "fila $n: no existe el rotulo $rotulo"
    info "     rotulo $rotulo (${escala} del ancho)"
    poner_rotulo "$seg" "$rotulo" "$escala" "$TMP/rot_$(printf '%03d' "$n").mp4"
    [ "$DRY" = 1 ] || mv "$TMP/rot_$(printf '%03d' "$n").mp4" "$seg"
  fi
  printf "file '%s'\n" "$seg" >> "$LISTA_CONCAT"
done < "$LISTA"

[ "$n" -gt 0 ] || morir "el manifiesto no tiene ninguna fila util"
info "$n segmentos"

# ---------------------------------------------------------------- concatenar
mkdir -p "$SALIDA"
MUDO="$TMP/mudo.mp4"
info "concatenando…"
correr "$FF" -hide_banner -loglevel error -y -f concat -safe 0 -i "$LISTA_CONCAT" \
  -c:v libx264 -preset medium -crf 17 -c:a aac "$MUDO"

# ---------------------------------------------------------------- sonido
# La musica se agacha bajo la voz con sidechaincompress: es ducking de verdad, no un
# volumen fijo. Sin voz, la musica va sola y normalizada.
H169="$SALIDA/final_16x9.mp4"
if [ "$DRY" = 1 ]; then DUR="<duracion del montaje>"; else DUR="$(duracion_de "$MUDO")"; fi
info "duracion del montaje: ${DUR}s"
if [ -n "$MUSICA" ] && [ -n "$VOZ" ]; then
  info "mezclando musica con ducking bajo la voz (-${DUCK_DB} dB)…"
  ratio=$(awk -v d="$DUCK_DB" 'BEGIN{r=d/2; if(r<1)r=1; printf "%.1f", r}')
  correr "$FF" -hide_banner -loglevel error -y -i "$MUDO" -i "$MUSICA" -i "$VOZ" \
    -filter_complex \
      "[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[mus];\
       [2:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[voz][llave];\
       [mus][llave]sidechaincompress=threshold=0.05:ratio=${ratio}:attack=20:release=400[musd];\
       [musd][voz]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-14:TP=-1.5,aresample=48000[aout]" \
    -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$DUR" "$H169"
elif [ -n "$MUSICA" ]; then
  info "anadiendo musica…"
  correr "$FF" -hide_banner -loglevel error -y -i "$MUDO" -i "$MUSICA" \
    -filter_complex "[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,loudnorm=I=-14:TP=-1.5,aresample=48000[aout]" \
    -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t "$DUR" "$H169"
else
  info "sin musica"
  correr cp "$MUDO" "$H169"
fi

# ---------------------------------------------------------------- vertical
if [ "$SOLO_HORIZONTAL" = 0 ]; then
  V916="$SALIDA/final_9x16.mp4"
  VA=$(( (ALTO * 9 / 16) / 2 * 2 )); VH=$ALTO   # par: libx264 no acepta anchos impares
  if [ "$VERTICAL" = "difuminado" ]; then
    info "exportando 9:16 (fondo difuminado)…"
    vfv="[0:v]split=2[fondo][frente];\
[fondo]scale=${VA}:${VH}:force_original_aspect_ratio=increase,crop=${VA}:${VH},gblur=sigma=30[bg];\
[frente]scale=${VA}:-2[fg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[vout]"
  else
    info "exportando 9:16 (recorte central)…"
    vfv="[0:v]scale=-2:${VH},crop=${VA}:${VH}:(iw-${VA})/2:0,setsar=1,format=yuv420p[vout]"
  fi
  correr "$FF" -hide_banner -loglevel error -y -i "$H169" \
    -filter_complex "$vfv" -map "[vout]" -map 0:a? \
    -c:v libx264 -preset medium -crf 18 -c:a copy "$V916"
fi

if [ "$DRY" = 1 ]; then
  info "--dry-run: no se ha ejecutado nada."
else
  info "listo:"
  ls -lh "$SALIDA"
fi
