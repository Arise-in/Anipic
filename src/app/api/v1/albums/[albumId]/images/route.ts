import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getAlbumById,
  addImageToAlbum,
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN 
} from "@/lib/github";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const session = await auth();
    const { albumId } = await params;
    const { imageId, imageSize = 0, imageUrl = '' } = await request.json();
    
    if (!imageId) {
      return NextResponse.json({ success: false, error: "Image ID is required" }, { status: 400 });
    }
    
    const album = await getAlbumById(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }
    
    const username = (session?.user as any)?.username || session?.user?.name;
    if (album.owner !== 'anonymous' && album.owner !== username) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }
    
    const success = await addImageToAlbum(imageId, albumId, imageSize, imageUrl, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to add image to album" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
