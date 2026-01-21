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

    const links = {
      short: `${baseUrl}/i/${imageId}`,
      viewer: `${baseUrl}/i/${imageId}`,
      embed: `${baseUrl}/e/${imageId}`,
      raw: image.rawUrl,
      direct: image.rawUrl,
      download: `${image.rawUrl}?download=true`,
      api: `${baseUrl}/api/v1/images/${imageId}`,
      qr: `${baseUrl}/api/v1/qr?id=${imageId}`,
      oembed: `${baseUrl}/api/v1/oembed?url=${encodeURIComponent(`${baseUrl}/i/${imageId}`)}`,
    };

    if (format === "text") {
      return new NextResponse(links.short, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (format === "redirect") {
      return NextResponse.redirect(image.rawUrl);
    }

    return NextResponse.json({
      success: true,
      data: {
        imageId: image.imageId,
        filename: image.filename,
        links,
      },
    });
  } catch (error) {
    console.error("Shortlink error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL required" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("host") || "";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    const imageIdMatch = url.match(/\/i\/([a-zA-Z0-9]+)/);
    if (imageIdMatch) {
      const imageId = imageIdMatch[1];
      return NextResponse.json({
        success: true,
        data: {
          shortUrl: `${baseUrl}/i/${imageId}`,
          imageId,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid AniPic URL" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Shortlink create error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
