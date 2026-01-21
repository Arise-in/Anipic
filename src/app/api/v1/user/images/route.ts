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
    const session = await auth();
    if (!session?.accessToken || !session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const owner = session.user.username;
    const token = session.accessToken;

    const response = await githubRequest(
      `/repos/${owner}/${PRIVATE_REPO_NAME}/contents/metadata.json`,
      {},
      token
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: true, data: [] });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = atob(data.content);
    const images = JSON.parse(content);

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error fetching user images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
