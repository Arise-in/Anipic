import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getAlbums, 
  createAlbum,
  getUserAlbums,
  PUBLIC_REPO_OWNER, 
  PUBLIC_GITHUB_TOKEN 
} from "@/lib/github";

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
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';
    
    if (userOnly && (session?.user as any)?.username) {
      const albums = await getUserAlbums((session.user as any).username);
      return NextResponse.json({ success: true, data: albums });
    }
    
    const albums = await getAlbums(PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN);
    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionAny = session as any;
    const { name, description, tags, isPrivate } = await req.json();
    
    if (!name) {
      return NextResponse.json({ success: false, error: "Album name is required" }, { status: 400 });
    }

    const creatorUsername = sessionAny?.user?.username || session?.user?.name || 'anonymous';
    
    if (isPrivate && sessionAny?.accessToken && sessionAny?.user?.username) {
      const owner = sessionAny.user.username;
      const token = sessionAny.accessToken;
      
      const albumId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      const newAlbum = {
        id: albumId,
        name,
        description: description || '',
        tags: tags || [],
        imageCount: 0,
        totalSize: 0,
        createdAt: new Date().toISOString(),
        coverImage: null,
        owner: owner,
        images: [],
        isPrivate: true,
      };
      
      let existingAlbums: any[] = [];
      let sha: string | undefined;
      
      try {
        const response = await githubRequest(
          `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/albums.json`,
          {},
          token
        );
        if (response.ok) {
          const data = await response.json();
          sha = data.sha;
          existingAlbums = JSON.parse(atob(data.content));
        }
      } catch {}
      
      existingAlbums.push(newAlbum);
      
      const updateRes = await githubRequest(
        `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/albums.json`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: `Create album ${name}`,
            content: btoa(JSON.stringify(existingAlbums, null, 2)),
            ...(sha && { sha }),
          }),
        },
        token
      );
      
      if (!updateRes.ok) {
        return NextResponse.json({ success: false, error: "Failed to create private album" }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, album: newAlbum });
    }
    
    const album = await createAlbum(name, description, tags, PUBLIC_REPO_OWNER, PUBLIC_GITHUB_TOKEN, creatorUsername);
    
    if (!album) {
      return NextResponse.json({ success: false, error: "Failed to create album" }, { status: 500 });
    }

    return NextResponse.json({ success: true, album });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
