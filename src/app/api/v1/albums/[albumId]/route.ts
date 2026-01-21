import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getAlbumById,
  renameAlbum,
  deleteAlbum,
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN 
} from "@/lib/github";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    const album = await getAlbumById(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    
    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const session = await auth();
    const { albumId } = await params;
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    
    const album = await getAlbumById(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }
    
    const username = (session?.user as any)?.username || session?.user?.name;
    if (album.owner !== 'anonymous' && album.owner !== username) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }
    
    const success = await renameAlbum(albumId, name, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to rename album" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const session = await auth();
    const { albumId } = await params;
    
    const album = await getAlbumById(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    if (!album) {
      return NextResponse.json({ success: false, error: "Album not found" }, { status: 404 });
    }
    
    const username = (session?.user as any)?.username || session?.user?.name;
    if (album.owner !== 'anonymous' && album.owner !== username) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }
    
    const success = await deleteAlbum(albumId, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to delete album" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
