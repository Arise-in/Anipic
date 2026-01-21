import { NextRequest, NextResponse } from "next/server";
import { getImageById } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const maxwidth = parseInt(searchParams.get('maxwidth') || '800');
    const maxheight = parseInt(searchParams.get('maxheight') || '600');
    const format = searchParams.get('format') || 'json';

    if (!url) {
      return NextResponse.json({ error: "url parameter required" }, { status: 400 });
    }

    const imageIdMatch = url.match(/\/i\/([a-zA-Z0-9]+)/);
    if (!imageIdMatch) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const imageId = imageIdMatch[1];
    const image = await getImageById(imageId);

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const origin = req.headers.get('origin') || req.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const oembed = {
      version: "1.0",
      type: "photo",
      provider_name: "AniPic",
      provider_url: baseUrl,
      title: image.filename,
      author_name: image.uploader,
      width: Math.min(maxwidth, 1920),
      height: Math.min(maxheight, 1080),
      url: image.rawUrl,
      thumbnail_url: image.rawUrl,
      thumbnail_width: 200,
      thumbnail_height: 200,
      web_page: `${baseUrl}/i/${imageId}`,
      cache_age: 86400
    };

    if (format === 'xml') {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<oembed>
  <version>${oembed.version}</version>
  <type>${oembed.type}</type>
  <provider_name>${oembed.provider_name}</provider_name>
  <provider_url>${oembed.provider_url}</provider_url>
  <title>${oembed.title}</title>
  <author_name>${oembed.author_name}</author_name>
  <width>${oembed.width}</width>
  <height>${oembed.height}</height>
  <url>${oembed.url}</url>
  <thumbnail_url>${oembed.thumbnail_url}</thumbnail_url>
  <thumbnail_width>${oembed.thumbnail_width}</thumbnail_width>
  <thumbnail_height>${oembed.thumbnail_height}</thumbnail_height>
</oembed>`;
      return new NextResponse(xml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    return NextResponse.json(oembed);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
