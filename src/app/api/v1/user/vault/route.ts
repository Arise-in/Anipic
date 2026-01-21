import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const PRIVATE_REPO_NAME = 'anipic-vault';

async function githubRequest(
  endpoint: string,
  options: RequestInit = {},
  token: string
): Promise<Response> {
  return fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as any;
    if (!session?.accessToken || !session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const owner = session.user.username as string;
    const token = session.accessToken as string;

    const repoResponse = await githubRequest(`/repos/${owner}/${PRIVATE_REPO_NAME}`, {}, token);
    
    if (!repoResponse.ok) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          imageCount: 0,
          size: 0,
          images: [],
        }
      });
    }

    const repoData = await repoResponse.json();

    const metadataResponse = await githubRequest(
      `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/metadata.json`,
      {},
      token
    );

    let images = [];
    if (metadataResponse.ok) {
      const data = await metadataResponse.json();
      const content = atob(data.content);
      images = JSON.parse(content);
    }

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        imageCount: images.length,
        size: repoData.size * 1024,
        repoUrl: repoData.html_url,
        isPrivate: repoData.private,
        createdAt: repoData.created_at,
        images,
      }
    });
  } catch (error) {
    console.error('Error fetching vault info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth() as any;
    if (!session?.accessToken || !session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { imageId } = await request.json();
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID required' },
        { status: 400 }
      );
    }

    const owner = session.user.username as string;
    const token = session.accessToken as string;

    const metadataResponse = await githubRequest(
      `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/metadata.json`,
      {},
      token
    );

    if (!metadataResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Vault not found' },
        { status: 404 }
      );
    }

    const metadataData = await metadataResponse.json();
    const metadataContent = atob(metadataData.content);
    const images = JSON.parse(metadataContent);
    
    const image = images.find((img: { imageId: string }) => img.imageId === imageId);
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    const extension = image.filename.split('.').pop() || 'jpg';
    const imagePath = `images/${imageId}.${extension}`;
    
    const imageFileResponse = await githubRequest(
      `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/${imagePath}`,
      {},
      token
    );

    if (imageFileResponse.ok) {
      const imageFileData = await imageFileResponse.json();
      await githubRequest(
        `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/${imagePath}`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            message: `Delete image ${imageId}`,
            sha: imageFileData.sha,
          }),
        },
        token
      );
    }

    const updatedImages = images.filter((img: { imageId: string }) => img.imageId !== imageId);
    const newMetadataContent = btoa(JSON.stringify(updatedImages, null, 2));
    
    await githubRequest(
      `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/metadata.json`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: `Remove metadata for ${imageId}`,
          content: newMetadataContent,
          sha: metadataData.sha,
        }),
      },
      token
    );

    return NextResponse.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
