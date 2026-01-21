import { NextRequest, NextResponse } from "next/server";
import { 
  deleteImage, 
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN,
  getPublicImages,
  getImageById
} from "@/lib/github";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const image = await getImageById(imageId);

    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...image,
        links: {
          view: `${baseUrl}/i/${image.imageId}`,
          embed: `${baseUrl}/e/${image.imageId}`,
          raw: image.rawUrl,
          direct: image.rawUrl,
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { imageId } = await params;
    const images = await getPublicImages();
    const image = images.find(img => img.imageId === imageId);

    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const success = await deleteImage(imageId, PUBLIC_REPO_OWNER, image.repository, PUBLIC_GITHUB_TOKEN);
    
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
