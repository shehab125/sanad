-- Sanad Student Services Platform Schema
-- Users/Profiles
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar(100),
  username varchar(80) unique,
  email varchar(150),
  phone varchar(20),
  university varchar(120),
  faculty varchar(120),
  avatar_url varchar(255),
  role varchar(20) default 'user',
  created_at timestamp default current_timestamp
);

-- Books
create table if not exists books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  title varchar(150) not null,
  subject varchar(120),
  university varchar(120),
  price numeric(10,2) not null,
  condition varchar(10) default 'used',
  description text,
  created_at timestamp default current_timestamp
);

create table if not exists book_images (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books (id) on delete cascade,
  image_url varchar(255)
);

-- Notes
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  title varchar(150) not null,
  subject varchar(120),
  university varchar(120),
  description text,
  pdf_url varchar(255) not null,
  pages_count integer default 0,
  price numeric(10,2) default 0,
  rating_avg numeric(3,2) default 0,
  created_at timestamp default current_timestamp
);

-- Tutors
create table if not exists tutors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  bio text,
  subjects text,
  price_per_hour numeric(10,2),
  rating_avg numeric(3,2) default 0,
  image_url varchar(255),
  university varchar(120),
  faculty varchar(120),
  created_at timestamp default current_timestamp
);

create table if not exists tutor_bookings (
  id uuid primary key default uuid_generate_v4(),
  tutor_id uuid references tutors (id) on delete cascade,
  student_id uuid references profiles (id) on delete cascade,
  booking_date date not null,
  booking_time time not null,
  status varchar(20) default 'pending',
  notes text,
  created_at timestamp default current_timestamp
);

-- Housing
create table if not exists housing (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  title varchar(150) not null,
  address varchar(255) not null,
  price numeric(10,2) not null,
  rooms integer default 1,
  description text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamp default current_timestamp
);

create table if not exists housing_images (
  id uuid primary key default uuid_generate_v4(),
  housing_id uuid references housing (id) on delete cascade,
  image_url varchar(255)
);

-- Tools
create table if not exists tools (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  title varchar(150) not null,
  category varchar(120),
  university varchar(120),
  price numeric(10,2) not null,
  condition varchar(10) default 'used',
  description text,
  created_at timestamp default current_timestamp
);

create table if not exists tool_images (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid references tools (id) on delete cascade,
  image_url varchar(255)
);

-- Favorites (polymorphic)
create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  item_type varchar(20) not null,
  item_id uuid not null,
  created_at timestamp default current_timestamp
);

-- Conversations and messages for chat
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_one uuid references profiles (id) on delete cascade,
  user_two uuid references profiles (id) on delete cascade,
  created_at timestamp default current_timestamp
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations (id) on delete cascade,
  sender_id uuid references profiles (id) on delete cascade,
  message_type varchar(10) default 'text',
  message_text text,
  image_url varchar(255),
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  is_seen boolean default false,
  created_at timestamp default current_timestamp
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles (id) on delete cascade,
  type varchar(50) not null,
  title varchar(150) not null,
  body text,
  is_read boolean default false,
  related_id uuid,
  created_at timestamp default current_timestamp
);

-- Reviews/Ratings
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid references profiles (id) on delete cascade,
  target_type varchar(20) not null,
  target_id uuid not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp default current_timestamp
);

-- Indexes for performance
create index if not exists idx_books_user on books (user_id);
create index if not exists idx_notes_user on notes (user_id);
create index if not exists idx_tutors_user on tutors (user_id);
create index if not exists idx_housing_user on housing (user_id);
create index if not exists idx_tools_user on tools (user_id);
create index if not exists idx_favorites_user on favorites (user_id);
create index if not exists idx_conversations_user_one on conversations (user_one);
create index if not exists idx_conversations_user_two on conversations (user_two);

-- Orders & digital purchases (payment gateway flow)
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles (id) on delete cascade not null,
  seller_id uuid references profiles (id) on delete cascade not null,
  item_type varchar(20) not null check (item_type in ('book', 'note', 'tool')),
  item_id uuid not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency varchar(3) not null default 'SAR',
  status varchar(20) not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  gateway varchar(20),
  gateway_payment_id text,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create index if not exists idx_orders_buyer on orders (buyer_id);
create index if not exists idx_orders_seller on orders (seller_id);
create index if not exists idx_orders_item on orders (item_type, item_id);

-- Paid notes: unlock PDF after successful purchase (check via join with orders or this table)
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

-- RLS: enable and allow buyers/sellers to see relevant orders; buyers create orders; buyers complete pending payment.
alter table orders enable row level security;
alter table note_purchases enable row level security;

create policy "orders_select_parties" on orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "orders_insert_buyer" on orders
  for insert with check (auth.uid() = buyer_id);

create policy "orders_update_buyer_pending" on orders
  for update
  using (auth.uid() = buyer_id and status = 'pending')
  with check (auth.uid() = buyer_id);

create policy "note_purchases_select_own" on note_purchases
  for select using (auth.uid() = user_id);

create policy "note_purchases_insert_own" on note_purchases
  for insert with check (auth.uid() = user_id);

-- Policy suggestions (use Supabase dashboard to configure RLS for other tables)