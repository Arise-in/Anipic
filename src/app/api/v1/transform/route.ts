import { NextRequest, NextResponse } from "next/server";
import { getImageByShortId } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("id");
    const rotate = searchParams.get("rotate");
    const flip = searchParams.get("flip");
    const blur = searchParams.get("blur");
    const grayscale = searchParams.get("grayscale");
    const sepia = searchParams.get("sepia");
    const brightness = searchParams.get("brightness");
    const contrast = searchParams.get("contrast");
    const saturation = searchParams.get("saturation");

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

    const transforms: Record<string, string | null> = {
      rotate,
      flip,
      blur,
      grayscale,
      sepia,
      brightness,
      contrast,
      saturation,
    };

    const activeTransforms = Object.entries(transforms)
      .filter(([, v]) => v !== null)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    const origin = req.headers.get("host") || "";
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

    return NextResponse.json({
      success: true,
      data: {
        imageId: image.imageId,
        original: image.rawUrl,
        transforms: activeTransforms,
        cssFilters: generateCSSFilters(transforms),
        note: "Apply CSS filters client-side or use an image processing service for server-side transforms.",
      },
    });
  } catch (error) {
    console.error("Transform error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateCSSFilters(transforms: Record<string, string | null>): string {
  const filters: string[] = [];

  if (transforms.blur) filters.push(`blur(${transforms.blur}px)`);
  if (transforms.grayscale) filters.push(`grayscale(${transforms.grayscale}%)`);
  if (transforms.sepia) filters.push(`sepia(${transforms.sepia}%)`);
  if (transforms.brightness) filters.push(`brightness(${transforms.brightness}%)`);
  if (transforms.contrast) filters.push(`contrast(${transforms.contrast}%)`);
  if (transforms.saturation) filters.push(`saturate(${transforms.saturation}%)`);

  return filters.length > 0 ? filters.join(" ") : "none";
}
