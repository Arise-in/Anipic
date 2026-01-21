import { NextRequest, NextResponse } from "next/server";
import { getImageByShortId } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");
    const linkType = searchParams.get("type") || "view";
    const size = Math.min(parseInt(searchParams.get("size") || "200"), 500);
    const format = searchParams.get("format") || "svg";
    const fgColor = searchParams.get("fg") || "000000";
    const bgColor = searchParams.get("bg") || "FFFFFF";
    const errorLevel = searchParams.get("error") || "M";
    const margin = parseInt(searchParams.get("margin") || "2");

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

    const links: Record<string, string> = {
      view: `${baseUrl}/i/${imageId}`,
      embed: `${baseUrl}/e/${imageId}`,
      raw: image.rawUrl,
      direct: image.rawUrl,
    };

    const targetUrl = links[linkType] || links.view;

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}&color=${fgColor}&bgcolor=${bgColor}&ecc=${errorLevel}&margin=${margin}&format=${format}`;

    return NextResponse.json({
      success: true,
      data: {
        imageId: image.imageId,
        qrCode: {
          url: qrApiUrl,
          targetUrl,
          linkType,
          size,
          format,
          foregroundColor: `#${fgColor}`,
          backgroundColor: `#${bgColor}`,
          errorCorrection: errorLevel,
          margin,
        },
        availableLinks: links,
      },
    });
  } catch (error) {
    console.error("QR error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
