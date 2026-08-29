-- Esquema de la base de datos del sistema interno de Bahía 79.
--
-- Cómo usarlo: en supabase.com, tu proyecto → SQL Editor → pega esto → Run.
-- Se puede volver a ejecutar sin miedo: no borra nada de lo que ya exista.
--
-- Aquí NO se guardan datos de huéspedes. Eso vive en LobbyPMS y se lee en vivo.
-- Aquí sólo hay cuentas del personal e historial de lo que hace cada quien.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ usuarios

create table if not exists usuarios (
  id       uuid primary key default gen_random_uuid(),
  usuario  text unique not null,                  -- nombre de acceso, en minúsculas
  nombre   text not null,                         -- nombre para mostrar
  rol      text not null default 'personal',      -- 'admin' o 'personal'
  sal      text not null,                         -- de la contraseña
  hash     text not null,                         -- scrypt; la clave nunca se guarda
  activo   boolean not null default true,
  creado   timestamptz not null default now(),
  constraint rol_valido check (rol in ('admin','personal'))
);

-- ----------------------------------------------------------------- historial

create table if not exists eventos (
  id         bigserial primary key,
  momento    timestamptz not null default now(),
  usuario_id uuid references usuarios(id) on delete set null,
  usuario    text,        -- copia del nombre: el historial sobrevive al borrado
  accion     text not null,
  detalle    jsonb,       -- qué se hizo, nunca quiénes son los huéspedes
  ip         text
);

create index if not exists eventos_momento on eventos (momento desc);
create index if not exists eventos_usuario on eventos (usuario);

-- ------------------------------------------------------------------ permisos
--
-- Sólo el servidor entra a estas tablas, con la clave service_role. El navegador
-- nunca habla con Supabase directamente, así que se cierra el acceso público:
-- activar RLS sin políticas deja las tablas invisibles para las claves anónimas.

alter table usuarios enable row level security;
alter table eventos  enable row level security;
