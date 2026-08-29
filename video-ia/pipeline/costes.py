"""Estimacion de coste antes de lanzar.

**Las tarifas cambian.** Estas son ordenes de magnitud para que el control de presupuesto
tenga algo con lo que trabajar, no una factura. Antes de una tanda grande, comprueba el precio
real en el panel de tu proveedor y ajusta esta tabla.
"""
from __future__ import annotations

# USD por imagen
IMAGEN = {
    "nano_banana_pro": {"1k": 0.04, "2k": 0.06, "4k": 0.12},
    "seedream_v5_pro": {"1k": 0.03, "1.5k": 0.04, "2k": 0.05},
    "flux_2_pro":      {"1k": 0.04, "2k": 0.07},
    "gpt_image_2":     {"1k": 0.05, "2k": 0.08},
}

# USD por segundo de video
VIDEO = {
    "seedance_2_5":      {"480p": 0.030, "720p": 0.062, "1080p": 0.124},
    "seedance_2_0":      {"480p": 0.036, "720p": 0.072, "1080p": 0.150, "4k": 0.480},
    "seedance_2_0_mini": {"480p": 0.015, "720p": 0.030},
}

# Seedance 2.5 renderiza nativo a 720p. Sus salidas 1080p son un reescalado del proveedor,
# no detalle nuevo. Cuando hace falta 4K de verdad, el unico que lo da es Seedance 2.0.
RESOLUCION_NATIVA = {"seedance_2_5": "720p", "seedance_2_0": "1080p"}
SOPORTA_4K = {"seedance_2_0"}


def coste_imagen(modelo: str, resolucion: str = "2k", n: int = 1) -> float:
    tabla = IMAGEN.get(modelo)
    if not tabla:
        raise ValueError(f"modelo de imagen desconocido: {modelo}")
    if resolucion not in tabla:
        raise ValueError(f"{modelo} no ofrece {resolucion}. Opciones: {sorted(tabla)}")
    return round(tabla[resolucion] * n, 4)


def coste_video(modelo: str, segundos: float, resolucion: str = "720p") -> float:
    tabla = VIDEO.get(modelo)
    if not tabla:
        raise ValueError(f"modelo de video desconocido: {modelo}")
    if resolucion not in tabla:
        raise ValueError(
            f"{modelo} no ofrece {resolucion}. Opciones: {sorted(tabla)}."
            + (" Para 4K real usa seedance_2_0." if resolucion == "4k" else ""))
    return round(tabla[resolucion] * max(4.0, segundos), 4)


def avisar_upscale(modelo: str, resolucion: str) -> str | None:
    """Regla 3: avisa cuando pides mas resolucion de la que el modelo renderiza de verdad."""
    nativa = RESOLUCION_NATIVA.get(modelo)
    orden = ["480p", "720p", "1080p", "4k"]
    if nativa and resolucion in orden and orden.index(resolucion) > orden.index(nativa):
        extra = (" Para 4K de verdad, el unico es seedance_2_0."
                 if resolucion == "4k" and modelo not in SOPORTA_4K else "")
        return (f"{modelo} renderiza nativo a {nativa}; {resolucion} es un reescalado del "
                f"proveedor, no detalle nuevo.{extra}")
    return None
