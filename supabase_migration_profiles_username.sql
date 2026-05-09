-- لو جدول profiles موجود بدون عمود username
alter table profiles add column if not exists username varchar(80);
create unique index if not exists profiles_username_unique on profiles (username) where username is not null;
