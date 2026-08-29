"""Proveedores. Todos exponen generate_image / generate_video / wait."""
from .base import Proveedor, Trabajo
from .fal import Fal
from .openai import OpenAI
from .higgsfield import Higgsfield
from .byteplus import BytePlus

DISPONIBLES = {"fal": Fal, "openai": OpenAI, "higgsfield": Higgsfield, "byteplus": BytePlus}

__all__ = ["Proveedor", "Trabajo", "Fal", "OpenAI", "Higgsfield", "BytePlus", "DISPONIBLES"]
