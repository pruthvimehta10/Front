# Supabase Storage Setup for Videos

## 1. Create a Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **"New Bucket"**
4. Name it **`videos`**
5. **Uncheck** "Public bucket" (we want it private)
6. Click **Create**

## 2. Set Up Row Level Security (RLS) Policies

Since the bucket is private, you need to create policies to control access.

### Option A: Allow Authenticated Users (Simple)

```sql
-- Allow authenticated users to READ videos
CREATE POLICY "Authenticated users can view videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos');
```

### Option B: Only Enrolled Users (More Secure)

```sql
-- Only allow users enrolled in the course to view videos
CREATE POLICY "Only enrolled users can view videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' 
  AND EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.user_id = auth.uid()
  )
);
```

## 3. Upload Videos

### Via Dashboard (Easy):
1. Go to **Storage** → **videos** bucket
2. Click **Upload file**
3. Select your video file
4. The path will be: `videos/your-video.mp4`

### Via Code (Programmatic):
```typescript
const { data, error } = await supabase.storage
  .from('videos')
  .upload('course-1/intro.mp4', videoFile, {
    cacheControl: '3600',
    upsert: false
  })
```

## 4. Get the Storage URL

After uploading, get the URL:

```typescript
// Not recommended - public URL (won't work with RLS)
const { data } = supabase.storage
  .from('videos')
  .getPublicUrl('course-1/intro.mp4')

// ✅ Recommended - signed URL (works with RLS, expires)
const { data } = await supabase.storage
  .from('videos')
  .createSignedUrl('course-1/intro.mp4', 3600) // 1 hour

console.log(data.signedUrl)
// Use this URL in your database
```

## 5. Store Video Path in Database

When creating a topic, store the **Supabase Storage URL**:

```sql
INSERT INTO topics (title, video_url, course_id)
VALUES (
  'Introduction to React',
  'https://your-project.supabase.co/storage/v1/object/sign/videos/react-intro.mp4',
  'course-uuid-here'
);
```

## 6. How the System Works

1. **User opens a course** → Frontend loads
2. **Video player component mounts** → Calls `/api/video/signed-url?topicId=123`
3. **API route fetches video_url from DB** → Checks if it's Supabase Storage
4. **If Supabase Storage** → Generates signed URL (expires in 1 hour)
5. **Returns signed URL** → Video player uses it
6. **URL auto-refreshes** → Before expiry (at 48 minutes)

## 7. Security Benefits

✅ **URL expires** after 1 hour (can't be shared long-term)  
✅ **RLS enforces access** (only authenticated users)  
✅ **No direct URL exposure** (signed URL is temporary)  
✅ **Automatic refresh** (seamless for users)  

## 8. External Videos (YouTube, Vimeo)

If `video_url` is NOT a Supabase URL, the API returns it as-is:

```typescript
// For external URLs
const { url } = await fetch('/api/video/signed-url?topicId=456')
console.log(url) // → "https://youtube.com/watch?v=..."
```

This supports mixed content (Supabase + external videos).

## 9. Testing

Upload a test video and set the topic's `video_url` to:
```
https://your-project.supabase.co/storage/v1/object/public/videos/test-video.mp4
```

The system will automatically generate signed URLs for it! 🎉
