import { NextRequest, NextResponse } from "next/server";
import { 
  uploadImageToGitHub, 
  findAvailableRepo, 
  getStorageStats,
  PUBLIC_REPO_OWNER,
  PUBLIC_GITHUB_TOKEN
} from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const albumId = formData.get("albumId") as string || "default";
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const repo = await findAvailableRepo(PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    const metadata = await uploadImageToGitHub(file, PUBLIC_REPO_OWNER, repo, PUBLIC_GITHUB_TOKEN);

    return NextResponse.json({
      success: true,
      data: {
        imageId: metadata.imageId,
        filename: metadata.filename,
        size: metadata.size,
        mimeType: metadata.mimeType,
        uploadedAt: metadata.uploadedAt,
        uploader: metadata.uploader,
        links: {
          view: `/i/${metadata.imageId}`,
          embed: `/e/${metadata.imageId}`,
          raw: metadata.rawUrl,
          direct: metadata.rawUrl
        }
      }
    });
  } catch (error) {
    console.error("API Upload error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
