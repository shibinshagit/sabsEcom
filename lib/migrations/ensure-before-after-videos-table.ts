import { sql } from "@/lib/database"

export async function ensureBeforeAfterVideosTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS before_after_videos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      thumbnail_url TEXT DEFAULT '',
      content_type VARCHAR(20) NOT NULL DEFAULT 'before' CHECK (content_type IN ('before', 'after', 'result')),
      media_type VARCHAR(20) NOT NULL DEFAULT 'video',
      before_image_url TEXT DEFAULT '',
      after_image_url TEXT DEFAULT '',
      result_video_url TEXT DEFAULT '',
      shop VARCHAR(10) NOT NULL DEFAULT 'Both' CHECK (shop IN ('A', 'B', 'Both')),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  await sql`
    ALTER TABLE before_after_videos
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'before',
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'video',
      ADD COLUMN IF NOT EXISTS before_image_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS after_image_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS result_video_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS shop VARCHAR(10) DEFAULT 'Both',
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `

  await sql`
    UPDATE before_after_videos
    SET
      media_type = CASE
        WHEN COALESCE(media_type, '') = '' THEN 'video'
        ELSE media_type
      END,
      result_video_url = CASE
        WHEN COALESCE(result_video_url, '') = '' AND COALESCE(video_url, '') <> '' THEN video_url
        ELSE COALESCE(result_video_url, '')
      END
    WHERE COALESCE(media_type, '') = '' OR (COALESCE(result_video_url, '') = '' AND COALESCE(video_url, '') <> '');
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_before_after_videos_active_shop
    ON before_after_videos(is_active, shop, display_order, created_at);
  `
}
