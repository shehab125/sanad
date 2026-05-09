-- طبّق هذا في Supabase SQL Editor إذا كان جدول orders موجوداً قبل إضافة نوع tool.
alter table orders drop constraint if exists orders_item_type_check;
alter table orders add constraint orders_item_type_check
  check (item_type in ('book', 'note', 'tool'));
