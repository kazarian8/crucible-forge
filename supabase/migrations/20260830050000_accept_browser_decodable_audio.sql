-- File DNA decodes and validates the audio before upload. Accept every genuine
-- audio MIME subtype so valid files are not rejected because a browser or OS
-- uses a different vendor-specific label for the same format.
update storage.buckets
set allowed_mime_types = array['audio/*']::text[]
where id = 'star-music';
