import { NextRequest, NextResponse } from "next/server";
import { getPublicImages } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    let images = await getPublicImages();

    if (search) {
      const searchLower = search.toLowerCase();
      images = images.filter(img => 
        img.filename.toLowerCase().includes(searchLower) ||
        img.imageId.toLowerCase().includes(searchLower) ||
        img.uploader.toLowerCase().includes(searchLower)
      );
    }

    if (sort === 'oldest') {
      images.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    } else if (sort === 'largest') {
      images.sort((a, b) => b.size - a.size);
    } else if (sort === 'smallest') {
      images.sort((a, b) => a.size - b.size);
    }

    const total = images.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedImages = images.slice(offset, offset + limit);

    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const data = paginatedImages.map(img => ({
      ...img,
      links: {
        view: `${baseUrl}/i/${img.imageId}`,
        embed: `${baseUrl}/e/${img.imageId}`,
        raw: img.rawUrl,
      }
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
