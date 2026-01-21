import { NextRequest, NextResponse } from "next/server";
import { getPublicImages, getStorageStats } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const images = await getPublicImages();
    const storageStats = await getStorageStats();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayUploads = images.filter(img => new Date(img.uploadedAt) >= today).length;
    const weekUploads = images.filter(img => new Date(img.uploadedAt) >= thisWeek).length;
    const monthUploads = images.filter(img => new Date(img.uploadedAt) >= thisMonth).length;

    const typeBreakdown: Record<string, number> = {};
    let totalSize = 0;
    images.forEach(img => {
      const ext = img.filename.split('.').pop()?.toLowerCase() || 'unknown';
      typeBreakdown[ext] = (typeBreakdown[ext] || 0) + 1;
      totalSize += img.size;
    });

    const sizeRanges = {
      tiny: images.filter(img => img.size < 50 * 1024).length,
      small: images.filter(img => img.size >= 50 * 1024 && img.size < 500 * 1024).length,
      medium: images.filter(img => img.size >= 500 * 1024 && img.size < 2 * 1024 * 1024).length,
      large: images.filter(img => img.size >= 2 * 1024 * 1024 && img.size < 10 * 1024 * 1024).length,
      huge: images.filter(img => img.size >= 10 * 1024 * 1024).length,
    };

    const uploadsByHour: Record<number, number> = {};
    const uploadsByDay: Record<string, number> = {};
    images.forEach(img => {
      const date = new Date(img.uploadedAt);
      const hour = date.getHours();
      uploadsByHour[hour] = (uploadsByHour[hour] || 0) + 1;
      const dayKey = date.toISOString().split('T')[0];
      uploadsByDay[dayKey] = (uploadsByDay[dayKey] || 0) + 1;
    });

    const topUploaders: Record<string, number> = {};
    images.forEach(img => {
      topUploaders[img.uploader] = (topUploaders[img.uploader] || 0) + 1;
    });
    const sortedUploaders = Object.entries(topUploaders)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalImages: images.length,
          totalSize,
          totalSizeFormatted: formatBytes(totalSize),
          averageSize: images.length > 0 ? Math.round(totalSize / images.length) : 0,
          averageSizeFormatted: images.length > 0 ? formatBytes(Math.round(totalSize / images.length)) : '0 B',
        },
        uploads: {
          today: todayUploads,
          thisWeek: weekUploads,
          thisMonth: monthUploads,
          total: images.length,
        },
        storage: {
          used: storageStats?.totalUsed || 0,
          usedFormatted: formatBytes(storageStats?.totalUsed || 0),
          percentUsed: storageStats?.percentUsed || 0,
          repos: storageStats?.repos.length || 0,
        },
        breakdown: {
          byType: typeBreakdown,
          bySize: sizeRanges,
        },
        activity: {
          byHour: uploadsByHour,
          byDay: Object.entries(uploadsByDay).slice(-30).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        },
        topUploaders: sortedUploaders,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
