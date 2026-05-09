-- شغّل هذا مرة واحدة إذا كان جدول tools موجوداً من قبل بدون عمود الجامعة.
alter table tools add column if not exists university varchar(120);
