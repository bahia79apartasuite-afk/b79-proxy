"""pipeline — ejecuta el sistema de la guia sin salir de la terminal.

Estado: **arquitectura preparada, sin ejecutar**. Mientras no exista `video-ia/.env` con las
claves, todo proveedor se niega a lanzar trabajo y el CLI lo dice claramente.

Lo que impone el codigo, no la documentacion:

  1. No lanza un video si no existe el start frame aprobado en `assets/frames/`.
  2. Prueba primero a 6 s y 720p; solo si se aprueba, lanza la version larga.
  3. Seedance 2.5 renderiza nativo a 720p y su tope es 1080p. Para 4K de verdad usa
     Seedance 2.0, que es el unico que lo ofrece.
  4. Maximo 4 trabajos simultaneos, con reintento y espera creciente ante un 429.
  5. Cada trabajo se anota en `runs/log.jsonl`.
  6. Presupuesto por ejecucion en `.env`; si se supera, el pipeline para.
"""
__version__ = "0.1.0"
