-- Create storage bucket for invoices
-- Run this in Supabase Dashboard > Storage

-- Note: This needs to be done via Supabase Dashboard Storage UI or via SQL:

-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: "invoices"
-- 4. Public: Yes (so WhatsApp can access the PDF)
-- 5. Create bucket

-- Alternatively, run this SQL to create the bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the invoices bucket
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow public read access (so WhatsApp can download)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Allow authenticated users to delete their own files (optional)
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
