-- Drop ALL existing policies for chalet-images bucket
DROP POLICY IF EXISTS "Chalet owners can upload their chalet images" ON storage.objects;
DROP POLICY IF EXISTS "Chalet owners can view their chalet images" ON storage.objects;
DROP POLICY IF EXISTS "Chalet owners can delete their chalet images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view chalet images" ON storage.objects;

-- Recreate policies with correct folder path checking
CREATE POLICY "Chalet owners can upload their chalet images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chalet-images' AND
  (
    -- Check if the second folder (chalet_id) belongs to the user
    auth.uid() IN (
      SELECT owner_id FROM public.chalets
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);

CREATE POLICY "Chalet owners can view their chalet images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chalet-images' AND
  (
    auth.uid() IN (
      SELECT owner_id FROM public.chalets
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);

CREATE POLICY "Chalet owners can delete their chalet images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chalet-images' AND
  (
    auth.uid() IN (
      SELECT owner_id FROM public.chalets
      WHERE id::text = (storage.foldername(name))[2]
    )
  )
);

-- Public can view all chalet images
CREATE POLICY "Public can view chalet images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chalet-images');