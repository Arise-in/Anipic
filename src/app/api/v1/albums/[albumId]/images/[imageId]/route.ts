import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getAlbumById,
  removeImageFromAlbum,
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN 
} from "@/lib/github";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string; imageId: string }> }
) {
  try {
    const session = await auth();
    const { albumId, imageId } = await params;
    
    const album = await getAlbumById(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }
    
    const username = (session?.user as any)?.username || session?.user?.name;
    if (album.owner !== 'anonymous' && album.owner !== username) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }
    
    const success = await removeImageFromAlbum(imageId, albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to remove image from album" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
