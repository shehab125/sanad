-- 1. Enable RLS on tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_images ENABLE ROW LEVEL SECURITY;

-- 2. Policies for 'notes' table
DROP POLICY IF EXISTS "Allow public read access on notes" ON notes;
CREATE POLICY "Allow public read access on notes" ON notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on notes" ON notes;
CREATE POLICY "Allow authenticated insert on notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to update notes" ON notes;
CREATE POLICY "Allow owners to update notes" ON notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to delete notes" ON notes;
CREATE POLICY "Allow owners to delete notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- 3. Policies for 'housing' table
DROP POLICY IF EXISTS "Allow public read access on housing" ON housing;
CREATE POLICY "Allow public read access on housing" ON housing FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on housing" ON housing;
CREATE POLICY "Allow authenticated insert on housing" ON housing FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to update housing" ON housing;
CREATE POLICY "Allow owners to update housing" ON housing FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow owners to delete housing" ON housing;
CREATE POLICY "Allow owners to delete housing" ON housing FOR DELETE USING (auth.uid() = user_id);

-- 4. Policies for 'housing_images' table
DROP POLICY IF EXISTS "Allow public read access on housing_images" ON housing_images;
CREATE POLICY "Allow public read access on housing_images" ON housing_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow owners to insert housing_images" ON housing_images;
CREATE POLICY "Allow owners to insert housing_images" ON housing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM housing h WHERE h.id = housing_id AND h.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Allow owners to delete housing_images" ON housing_images;
CREATE POLICY "Allow owners to delete housing_images" ON housing_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM housing h WHERE h.id = housing_id AND h.user_id = auth.uid())
);

-- 5. Storage Policies (Buckets: notes and housing)
-- Make sure buckets 'notes' and 'housing' are created in Supabase Dashboard -> Storage

-- Notes Bucket Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'notes');

DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'notes' AND auth.role() = 'authenticated'
);

-- Housing Bucket Policies
DROP POLICY IF EXISTS "Public Housing Access" ON storage.objects;
CREATE POLICY "Public Housing Access" ON storage.objects FOR SELECT USING (bucket_id = 'housing');

DROP POLICY IF EXISTS "Allow authenticated housing upload" ON storage.objects;
CREATE POLICY "Allow authenticated housing upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'housing' AND auth.role() = 'authenticated'
);
