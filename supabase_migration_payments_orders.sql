-- Payment bootstrap migration (run once in Supabase SQL Editor)
-- Creates orders + note_purchases and the minimum RLS policies required by checkout.

create extension if not exists "uuid-ossp";

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles (id) on delete cascade not null,
  seller_id uuid references profiles (id) on delete cascade not null,
  item_type varchar(20) not null check (item_type in ('book', 'note', 'tool')),
  item_id uuid not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency varchar(3) not null default 'EGP',
  status varchar(20) not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  gateway varchar(20),
  gateway_payment_id text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create index if not exists idx_orders_buyer on orders (buyer_id);
create index if not exists idx_orders_seller on orders (seller_id);
create index if not exists idx_orders_item on orders (item_type, item_id);

create table if not exists note_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade not null,
  note_id uuid references notes (id) on delete cascade not null,
  order_id uuid references orders (id) on delete set null,
  created_at timestamp default current_timestamp,
  unique (user_id, note_id)
);

create index if not exists idx_note_purchases_user on note_purchases (user_id);
create index if not exists idx_note_purchases_note on note_purchases (note_id);

alter table orders enable row level security;
alter table note_purchases enable row level security;

drop policy if exists "orders_select_parties" on orders;
create policy "orders_select_parties" on orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "orders_insert_buyer" on orders;
create policy "orders_insert_buyer" on orders
  for insert with check (auth.uid() = buyer_id);

drop policy if exists "orders_update_buyer_pending" on orders;
create policy "orders_update_buyer_pending" on orders
  for update using (auth.uid() = buyer_id and status = 'pending')
  with check (auth.uid() = buyer_id);

drop policy if exists "note_purchases_select_owner" on note_purchases;
create policy "note_purchases_select_owner" on note_purchases
  for select using (auth.uid() = user_id);

drop policy if exists "note_purchases_insert_owner" on note_purchases;
create policy "note_purchases_insert_owner" on note_purchases
  for insert with check (auth.uid() = user_id);
