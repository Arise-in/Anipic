import { NextRequest, NextResponse } from "next/server";
import { getImageByShortId } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");
    const style = searchParams.get("style") || "default";
    const theme = searchParams.get("theme") || "dark";
    const showInfo = searchParams.get("info") !== "false";
    const width = searchParams.get("width") || "100%";
    const height = searchParams.get("height") || "auto";
    const format = searchParams.get("format") || "html";

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

    const embedCodes = {
      html: `<img src="${image.rawUrl}" alt="${image.filename}" style="width:${width};height:${height};" loading="lazy" />`,
      markdown: `![${image.filename}](${image.rawUrl})`,
      bbcode: `[img]${image.rawUrl}[/img]`,
      iframe: `<iframe src="${baseUrl}/e/${imageId}" width="${width === "100%" ? "600" : width}" height="${height === "auto" ? "400" : height}" frameborder="0" allowfullscreen></iframe>`,
      directLink: image.rawUrl,
      viewerLink: `${baseUrl}/i/${imageId}`,
      thumbnailHtml: `<a href="${baseUrl}/i/${imageId}"><img src="${image.rawUrl}" alt="${image.filename}" style="max-width:200px;height:auto;" loading="lazy" /></a>`,
    };

    return NextResponse.json({
      success: true,
      data: {
        imageId: image.imageId,
        filename: image.filename,
        embedCodes,
        options: {
          style,
          theme,
          showInfo,
          width,
          height,
        },
      },
    });
  } catch (error) {
    console.error("Embed error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
