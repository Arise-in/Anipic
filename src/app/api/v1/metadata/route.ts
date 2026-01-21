import { NextRequest, NextResponse } from "next/server";
import { getImageByShortId, getPublicImages } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");
    const format = searchParams.get("format") || "json";

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "Image ID required" },
        { status: 400 }
      );
    }

    const image = await getImageByShortId(imageId);
    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    const origin = req.headers.get("host") || "";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    const metadata = {
      basic: {
        imageId: image.imageId,
        filename: image.filename,
        mimeType: image.mimeType,
        size: image.size,
        sizeFormatted: formatFileSize(image.size),
        dimensions: image.dimensions || null,
        uploadedAt: image.uploadedAt,
        uploader: image.uploader,
      },
      technical: {
        repository: image.repository,
        rawUrl: image.rawUrl,
        cdnProvider: "GitHub",
        cacheControl: "public, max-age=31536000",
        contentType: image.mimeType,
      },
      links: {
        view: `${baseUrl}/i/${imageId}`,
        embed: `${baseUrl}/e/${imageId}`,
        raw: image.rawUrl,
        api: `${baseUrl}/api/v1/images/${imageId}`,
      },
      openGraph: {
        title: image.filename,
        description: `Image hosted on AniPic - ${formatFileSize(image.size)}`,
        image: image.rawUrl,
        url: `${baseUrl}/i/${imageId}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: image.filename,
        description: `Image hosted on AniPic`,
        image: image.rawUrl,
      },
    };

    if (format === "opengraph") {
      return NextResponse.json({ success: true, data: metadata.openGraph });
    }

    if (format === "twitter") {
      return NextResponse.json({ success: true, data: metadata.twitter });
    }

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Metadata error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
