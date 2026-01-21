import { NextRequest, NextResponse } from "next/server";
import { getPublicImages } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const minSize = parseInt(searchParams.get('minSize') || '0');
    const maxSize = parseInt(searchParams.get('maxSize') || '0');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!q && type === 'all') {
      return NextResponse.json({ 
        success: false, 
        error: "Search query (q) is required" 
      }, { status: 400 });
    }

    let images = await getPublicImages();
    const queryLower = q.toLowerCase();

    if (q) {
      images = images.filter(img => {
        const matchFilename = img.filename.toLowerCase().includes(queryLower);
        const matchId = img.imageId.toLowerCase().includes(queryLower);
        const matchUploader = img.uploader.toLowerCase().includes(queryLower);
        return matchFilename || matchId || matchUploader;
      });
    }

    if (type !== 'all') {
      const typeMap: Record<string, string[]> = {
        'image': ['image/jpeg', 'image/png', 'image/webp'],
        'gif': ['image/gif'],
        'svg': ['image/svg+xml'],
      };
      const allowedTypes = typeMap[type] || [];
      if (allowedTypes.length > 0) {
        images = images.filter(img => allowedTypes.includes(img.mimeType));
      }
    }

    if (minSize > 0) {
      images = images.filter(img => img.size >= minSize);
    }
    if (maxSize > 0) {
      images = images.filter(img => img.size <= maxSize);
    }

    if (fromDate) {
      const from = new Date(fromDate);
      images = images.filter(img => new Date(img.uploadedAt) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      images = images.filter(img => new Date(img.uploadedAt) <= to);
    }

    if (sort === 'newest') {
      images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } else if (sort === 'oldest') {
      images.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    } else if (sort === 'largest') {
      images.sort((a, b) => b.size - a.size);
    } else if (sort === 'smallest') {
      images.sort((a, b) => a.size - b.size);
    }

    const total = images.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const results = images.slice(offset, offset + limit);

    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const data = results.map(img => ({
      ...img,
      links: {
        view: `${baseUrl}/i/${img.imageId}`,
        embed: `${baseUrl}/e/${img.imageId}`,
        raw: img.rawUrl,
      }
    }));

    return NextResponse.json({
      success: true,
      query: q,
      filters: { type, minSize, maxSize, fromDate, toDate },
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
