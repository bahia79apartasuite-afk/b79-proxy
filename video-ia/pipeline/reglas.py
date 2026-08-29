"""Las reglas del sistema, impuestas por el codigo y no solo documentadas.

Cada una levanta una excepcion con un mensaje que dice que hacer. Un pipeline que solo
avisa en un README acaba lanzando 28 videos sin start frame la primera noche que alguien
tiene prisa.
"""
from __future__ import annotations

from pathlib import Path

from .config import RAIZ
from .costes import RESOLUCION_NATIVA, SOPORTA_4K

FRAMES = RAIZ / "assets" / "frames"
APROBADOS = RAIZ / "assets" / "frames" / "aprobados.txt"


class ReglaRota(RuntimeError):
    pass


def start_frame_de(plano: str) -> Path:
    return FRAMES / f"{plano}.png"


def exigir_start_frame(plano: str) -> Path:
    """Regla 1: no se anima sin start frame aprobado.

    'Aprobado' no es 'existe el archivo': es que su nombre este en assets/frames/aprobados.txt.
    Mirar una imagen y decidir es un paso humano, y el pipeline no puede saltarselo.
    """
    ruta = start_frame_de(plano)
    if not ruta.exists():
        raise ReglaRota(
            f"El plano {plano} no tiene start frame en {ruta}.\n"
            f"Genera primero:  python -m pipeline frames <shotlist.md>")
    if not APROBADOS.exists() or f"{plano}.png" not in APROBADOS.read_text().split():
        raise ReglaRota(
            f"El start frame de {plano} existe pero no esta aprobado.\n"
            f"Miralo. Si vale, anade '{plano}.png' a {APROBADOS} y vuelve a lanzar.\n"
            f"Aprobar sin mirar es como no tener la regla.")
    return ruta


def exigir_prueba(plano: str, registro, duracion_final: int) -> None:
    """Regla 2: primero 6 s a 720p; la version larga solo si la prueba se aprobo."""
    if duracion_final <= 6:
        return
    hechas = {}
    if registro.ruta.exists():
        import json
        for linea in registro.ruta.read_text().splitlines():
            if not linea.strip():
                continue
            d = json.loads(linea)
            if d.get("plano") == plano and d.get("tipo") == "video" and d.get("estado") == "ok":
                hechas[d["parametros"].get("duration")] = d
    if not any(k and k <= 6 for k in hechas):
        raise ReglaRota(
            f"El plano {plano} no tiene un pase de prueba aprobado.\n"
            f"Lanza primero 6 s a 720p, mira el resultado, y solo entonces la version larga.\n"
            f"Un plano largo que sale mal cuesta lo mismo que tres pruebas cortas.")


def comprobar_resolucion(modelo: str, resolucion: str) -> None:
    """Regla 3: no dejes que te cobren un 4K que es un reescalado."""
    if resolucion == "4k" and modelo not in SOPORTA_4K:
        raise ReglaRota(
            f"{modelo} no da 4K de verdad. Su maximo nativo es "
            f"{RESOLUCION_NATIVA.get(modelo, 'menor')}.\n"
            f"Para 4K real usa seedance_2_0, que es el unico que lo ofrece.")


def limite_simultaneos(n_pedidos: int, tope: int) -> int:
    """Regla 4: nunca mas de `tope` trabajos a la vez."""
    return min(n_pedidos, max(1, tope))
