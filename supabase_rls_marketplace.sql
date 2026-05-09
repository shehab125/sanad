-- سياسات Row Level Security لسوق الكتب والأدوات (تشغيلها في Supabase → SQL Editor).
-- لو الجداول بدون RLS والإضافة تعمل، لا تحتاج هذا — لو فعلت RLS من لوحة التحكم بدون سياسات، الإضافة والعرض يفشلوا.

-- امتداد UUID (لو مش مفعّل)
create extension if not exists "uuid-ossp";

-- ─── الكتب ───
alter table books enable row level security;

drop policy if exists "sanad_books_select_public" on books;
create policy "sanad_books_select_public" on books for select using (true);

drop policy if exists "sanad_books_insert_own" on books;
create policy "sanad_books_insert_own" on books for insert with check (auth.uid() = user_id);

drop policy if exists "sanad_books_update_own" on books;
create policy "sanad_books_update_own" on books for update using (auth.uid() = user_id);

drop policy if exists "sanad_books_delete_own" on books;
create policy "sanad_books_delete_own" on books for delete using (auth.uid() = user_id);

-- ─── صور الكتب ───
alter table book_images enable row level security;

drop policy if exists "sanad_book_images_select_public" on book_images;
create policy "sanad_book_images_select_public" on book_images for select using (true);

drop policy if exists "sanad_book_images_insert_own_book" on book_images;
create policy "sanad_book_images_insert_own_book" on book_images for insert with check (
  exists (select 1 from books b where b.id = book_id and b.user_id = auth.uid())
);

drop policy if exists "sanad_book_images_delete_own" on book_images;
create policy "sanad_book_images_delete_own" on book_images for delete using (
  exists (select 1 from books b where b.id = book_id and b.user_id = auth.uid())
);

-- ─── الأدوات (منتجات) ───
alter table tools enable row level security;

drop policy if exists "sanad_tools_select_public" on tools;
create policy "sanad_tools_select_public" on tools for select using (true);

drop policy if exists "sanad_tools_insert_own" on tools;
create policy "sanad_tools_insert_own" on tools for insert with check (auth.uid() = user_id);

drop policy if exists "sanad_tools_update_own" on tools;
create policy "sanad_tools_update_own" on tools for update using (auth.uid() = user_id);

drop policy if exists "sanad_tools_delete_own" on tools;
create policy "sanad_tools_delete_own" on tools for delete using (auth.uid() = user_id);

alter table tool_images enable row level security;

drop policy if exists "sanad_tool_images_select_public" on tool_images;
create policy "sanad_tool_images_select_public" on tool_images for select using (true);

drop policy if exists "sanad_tool_images_insert_own_tool" on tool_images;
create policy "sanad_tool_images_insert_own_tool" on tool_images for insert with check (
  exists (select 1 from tools t where t.id = tool_id and t.user_id = auth.uid())
);

drop policy if exists "sanad_tool_images_delete_own" on tool_images;
create policy "sanad_tool_images_delete_own" on tool_images for delete using (
  exists (select 1 from tools t where t.id = tool_id and t.user_id = auth.uid())
);

-- ─── الملف الشخصي (لإنشاء الصف تلقائياً عند أول إضافة منتج لو كان ناقصاً) ───
alter table profiles enable row level security;

drop policy if exists "sanad_profiles_select_public" on profiles;
create policy "sanad_profiles_select_public" on profiles for select using (true);

drop policy if exists "sanad_profiles_insert_self" on profiles;
create policy "sanad_profiles_insert_self" on profiles for insert with check (auth.uid() = id);

drop policy if exists "sanad_profiles_update_self" on profiles;
create policy "sanad_profiles_update_self" on profiles for update using (auth.uid() = id);
