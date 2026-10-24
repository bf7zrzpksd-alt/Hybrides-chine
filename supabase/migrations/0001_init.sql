-- Schéma initial de l'app « Hybrides chinoises ».
-- Toutes les lectures/écritures passent par le serveur Next.js avec la clé service_role.
-- RLS est activé sans politique : la clé publique (anon) n'a accès à rien.

create extension if not exists pgcrypto;

create table listings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  url text not null,
  title text not null,
  brand text,
  model text,
  powertrain text not null default 'UNKNOWN',
  price_eur integer,
  vat_deductible boolean not null default false,
  seller_vat_rate numeric(4,3),
  mileage_km integer,
  first_registration text, -- AAAA-MM
  country text,
  seller_name text,
  image_url text,
  status text not null default 'active', -- active | favori | ecarte | achete
  notes text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source, source_id)
);
create index listings_brand_idx on listings (brand);
create index listings_last_seen_idx on listings (last_seen_at desc);

create table price_history (
  listing_id uuid not null references listings(id) on delete cascade,
  price_eur integer not null,
  seen_at timestamptz not null default now(),
  primary key (listing_id, seen_at)
);

-- Prix de référence en Suisse (neuf importateur ou occasion AutoScout24.ch), saisis à la main au départ.
create table swiss_prices (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  kind text not null default 'neuf', -- neuf | occasion
  price_chf integer not null,
  source_url text,
  updated_at timestamptz not null default now(),
  unique (brand, model, kind)
);

-- Réglages des frais (une seule ligne).
create table settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb
);
insert into settings (id) values (1);

-- Sélections à partager avec un client via un lien secret.
create table shortlists (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(12), 'hex'),
  title text not null,
  client_name text,
  created_at timestamptz not null default now()
);

create table shortlist_items (
  shortlist_id uuid not null references shortlists(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  sale_price_chf integer,
  note text,
  primary key (shortlist_id, listing_id)
);

-- Journal des e-mails reçus, pour vérifier la lecture des alertes.
create table inbound_emails (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  sender text,
  subject text,
  parsed_count int not null default 0,
  raw_html text
);

alter table listings enable row level security;
alter table price_history enable row level security;
alter table swiss_prices enable row level security;
alter table settings enable row level security;
alter table shortlists enable row level security;
alter table shortlist_items enable row level security;
alter table inbound_emails enable row level security;
