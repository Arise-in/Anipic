import { NextRequest, NextResponse } from "next/server";
import { getImageByShortId } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");
    const width = searchParams.get("w") || searchParams.get("width");
    const height = searchParams.get("h") || searchParams.get("height");
    const quality = searchParams.get("q") || searchParams.get("quality") || "80";
    const format = searchParams.get("f") || searchParams.get("format");

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

    const params = new URLSearchParams();
    if (width) params.set("w", width);
    if (height) params.set("h", height);
    if (quality) params.set("q", quality);
    if (format) params.set("fm", format);

    const origin = req.headers.get("host") || "";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    return NextResponse.json({
      success: true,
      data: {
        imageId: image.imageId,
        original: image.rawUrl,
        resized: {
          url: `${baseUrl}/api/v1/proxy?id=${imageId}&${params.toString()}`,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          quality: parseInt(quality),
          format: format || "auto",
        },
        note: "GitHub CDN serves images directly. For dynamic resizing, use a service like Cloudinary or imgix.",
      },
    });
  } catch (error) {
    console.error("Resize error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
