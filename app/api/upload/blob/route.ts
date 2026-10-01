import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Video upload unavailable: BLOB_READ_WRITE_TOKEN is not set. Add a Vercel Blob store to your project.",
      },
      { status: 500 },
    )
  }

  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "video/x-msvideo",
          "video/x-matroska",
          "video/*",
        ],
        maximumSizeInBytes: MAX_VIDEO_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No-op: client already receives the blob URL from upload().
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Blob client upload handshake failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to prepare video upload",
      },
      { status: 400 },
    )
  }
}
