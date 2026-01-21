import { NextRequest, NextResponse } from "next/server";
import { 
  getStorageStats,
  PUBLIC_REPO_OWNER,
  PUBLIC_GITHUB_TOKEN
} from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getStorageStats(PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    return NextResponse.json({
      success: true,
      data: {
        totalUsed: stats.totalUsed,
        totalCapacity: stats.totalCapacity,
        repos: stats.repos.map(r => ({
          name: r.name,
          size: r.size,
          imageCount: r.imageCount,
          percentFull: (r.size / (800 * 1024 * 1024)) * 100
        })),
        imageCount: stats.imageCount,
        availableSpace: stats.availableSpace
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
