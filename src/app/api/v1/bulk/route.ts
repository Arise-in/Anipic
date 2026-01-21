import { NextRequest, NextResponse } from "next/server";
import { getPublicImages, deleteImage, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, imageIds } = body;

    if (!action || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: action, imageIds" 
      }, { status: 400 });
    }

    if (imageIds.length > 50) {
      return NextResponse.json({ 
        success: false, 
        error: "Maximum 50 images per bulk operation" 
      }, { status: 400 });
    }

    const images = await getPublicImages();
    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const results: { imageId: string; success: boolean; error?: string; data?: any }[] = [];

    switch (action) {
      case 'get':
        for (const imageId of imageIds) {
          const image = images.find(img => img.imageId === imageId);
          if (image) {
            results.push({
              imageId,
              success: true,
              data: {
                ...image,
                links: {
                  view: `${baseUrl}/i/${image.imageId}`,
                  embed: `${baseUrl}/e/${image.imageId}`,
                  raw: image.rawUrl,
                }
              }
            });
          } else {
            results.push({ imageId, success: false, error: "Not found" });
          }
        }
        break;

      case 'delete':
        for (const imageId of imageIds) {
          const image = images.find(img => img.imageId === imageId);
          if (!image) {
            results.push({ imageId, success: false, error: "Not found" });
            continue;
          }
          const deleted = await deleteImage(imageId, PUBLIC_REPO_OWNER, image.repository, PUBLIC_GITHUB_TOKEN);
          results.push({ 
            imageId, 
            success: deleted, 
            error: deleted ? undefined : "Delete failed" 
          });
        }
        break;

      case 'info':
        for (const imageId of imageIds) {
          const image = images.find(img => img.imageId === imageId);
          if (image) {
            results.push({
              imageId,
              success: true,
              data: {
                exists: true,
                filename: image.filename,
                size: image.size,
                mimeType: image.mimeType,
                uploadedAt: image.uploadedAt,
                uploader: image.uploader,
              }
            });
          } else {
            results.push({ imageId, success: false, data: { exists: false } });
          }
        }
        break;

      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}. Supported: get, delete, info` 
        }, { status: 400 });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      action,
      summary: { total: imageIds.length, successful, failed },
      results,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
