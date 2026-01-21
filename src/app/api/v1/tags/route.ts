import { NextRequest, NextResponse } from "next/server";
import { getPublicImages } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const images = await getPublicImages();

    const tagCounts: Record<string, number> = {};
    images.forEach((img) => {
      const extension = img.filename.split(".").pop()?.toLowerCase() || "unknown";
      tagCounts[extension] = (tagCounts[extension] || 0) + 1;

      const sizeTag =
        img.size < 100 * 1024
          ? "small"
          : img.size < 1024 * 1024
          ? "medium"
          : "large";
      tagCounts[sizeTag] = (tagCounts[sizeTag] || 0) + 1;
    });

    if (tag) {
      const tagLower = tag.toLowerCase();
      const filteredImages = images.filter((img) => {
        const extension = img.filename.split(".").pop()?.toLowerCase();
        const sizeTag =
          img.size < 100 * 1024
            ? "small"
            : img.size < 1024 * 1024
            ? "medium"
            : "large";
        return extension === tagLower || sizeTag === tagLower;
      });

      const total = filteredImages.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedImages = filteredImages.slice(offset, offset + limit);

      const origin = req.headers.get("host") || "";
      const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`;

      return NextResponse.json({
        success: true,
        tag,
        data: paginatedImages.map((img) => ({
          ...img,
          links: {
            view: `${baseUrl}/i/${img.imageId}`,
            embed: `${baseUrl}/e/${img.imageId}`,
            raw: img.rawUrl,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    }

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      success: true,
      data: {
        tags: sortedTags,
        totalImages: images.length,
        categories: {
          byFormat: sortedTags.filter((t) =>
            ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(t.name)
          ),
          bySize: sortedTags.filter((t) =>
            ["small", "medium", "large"].includes(t.name)
          ),
        },
      },
    });
  } catch (error) {
    console.error("Tags error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
