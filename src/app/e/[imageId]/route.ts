import { NextRequest, NextResponse } from "next/server";

const PUBLIC_GITHUB_TOKEN = "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";
const PUBLIC_REPO_OWNER = "Arise-in";
const PUBLIC_REPO_BASE = "anipic-public";

interface ImageMetadata {
  imageId: string;
  filename: string;
  rawUrl: string;
  mimeType: string;
}

async function getImageMetadata(imageId: string): Promise<ImageMetadata | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${PUBLIC_REPO_OWNER}/${PUBLIC_REPO_BASE}/contents/metadata.json`,
      {
        headers: {
          Authorization: `Bearer ${PUBLIC_GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const content = atob(data.content);
    const metadata: ImageMetadata[] = JSON.parse(content);
    return metadata.find((img) => img.imageId === imageId) || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;

  const metadata = await getImageMetadata(imageId);

  if (!metadata) {
    return new NextResponse("Image not found", { status: 404 });
  }

  try {
    const imageResponse = await fetch(metadata.rawUrl);

    if (!imageResponse.ok) {
      return new NextResponse("Failed to fetch image", { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = metadata.mimeType || "image/jpeg";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
