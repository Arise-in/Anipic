import { NextRequest, NextResponse } from "next/server";
import { 
  uploadImageToGitHub, 
  findAvailableRepo, 
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN 
} from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { url, albumId } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch image from URL" }, { status: 400 });
    }

    const blob = await response.blob();
    const filename = url.split('/').pop()?.split('?')[0] || 'downloaded-image.jpg';
    const file = new File([blob], filename, { type: blob.type });

    const repo = await findAvailableRepo(PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    const metadata = await uploadImageToGitHub(file, PUBLIC_REPO_OWNER, repo, PUBLIC_GITHUB_TOKEN);

    return NextResponse.json({
      success: true,
      data: {
        imageId: metadata.imageId,
        filename: metadata.filename,
        links: {
          view: `/i/${metadata.imageId}`,
          raw: metadata.rawUrl
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
