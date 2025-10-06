-- Create storage bucket for chalet images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chalet-images', 'chalet-images', true);

-- Allow chalet owners to upload images for their chalets
CREATE POLICY "Chalet owners can upload their chalet images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chalet-images' AND
  auth.uid() IN (
    SELECT owner_id FROM public.chalets
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow chalet owners to view their chalet images
CREATE POLICY "Chalet owners can view their chalet images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chalet-images' AND
  auth.uid() IN (
    SELECT owner_id FROM public.chalets
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow chalet owners to delete their chalet images
CREATE POLICY "Chalet owners can delete their chalet images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chalet-images' AND
  auth.uid() IN (
    SELECT owner_id FROM public.chalets
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Allow public to view all chalet images
CREATE POLICY "Public can view chalet images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chalet-images');