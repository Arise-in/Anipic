import { NextRequest, NextResponse } from "next/server";
import { getPublicImages } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 10);
    const format = searchParams.get('format') || 'json';

    const images = await getPublicImages();
    
    if (images.length === 0) {
      return NextResponse.json({ success: false, error: "No images available" }, { status: 404 });
    }

    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    if (format === 'redirect' && selected.length === 1) {
      return NextResponse.redirect(selected[0].rawUrl);
    }

    if (format === 'url' && selected.length === 1) {
      return new NextResponse(selected[0].rawUrl, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const data = selected.map(img => ({
      ...img,
      links: {
        view: `${baseUrl}/i/${img.imageId}`,
        embed: `${baseUrl}/e/${img.imageId}`,
        raw: img.rawUrl,
      }
    }));

    return NextResponse.json({
      success: true,
      data: count === 1 ? data[0] : data,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
