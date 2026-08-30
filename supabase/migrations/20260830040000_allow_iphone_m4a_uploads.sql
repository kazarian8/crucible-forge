-- Safari and iOS file pickers can report valid M4A audio using any of these
-- equivalent MIME types. Keep the bucket private while accepting each alias.
update storage.buckets
set allowed_mime_types = array[
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/x-flac',
  'audio/aiff',
  'audio/x-aiff',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg'
]::text[]
where id = 'star-music';
