import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_GITHUB_TOKEN = process.env.GITHUB_TOKEN || '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';
const PUBLIC_REPO_OWNER = 'Arise-in';
const PUBLIC_REPO_BASE = 'anipic-public';
const PRIVATE_REPO_NAME = 'anipic-vault';

interface ImageMetadata {
  imageId: string;
  filename: string;
  uploadedAt: string;
  uploader: string;
  size: number;
  mimeType: string;
  repository: string;
  rawUrl: string;
  viewUrl: string;
  embedUrl: string;
  isPrivate?: boolean;
  albumId?: string;
}

function generateUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function githubRequest(
  endpoint: string,
  options: RequestInit = {},
  token: string = PUBLIC_GITHUB_TOKEN
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

async function getExistingImageIds(owner: string, repo: string, token: string): Promise<string[]> {
  try {
    const response = await githubRequest(`/repos/${owner}/${repo}/contents/images`, {}, token);
    if (!response.ok) return [];
    const files = await response.json();
    if (!Array.isArray(files)) return [];
    return files.map((f: { name: string }) => f.name.split('.')[0]);
  } catch {
    return [];
  }
}

async function ensureUniqueId(owner: string, repo: string, token: string): Promise<string> {
  const existingIds = await getExistingImageIds(owner, repo, token);
  let attempts = 0;
  let id: string;
  do {
    id = generateUniqueId();
    attempts++;
    if (attempts > 100) throw new Error('ID generation failed');
  } while (existingIds.includes(id));
  return id;
}

async function checkRepoExists(owner: string, repo: string, token: string): Promise<boolean> {
  const response = await githubRequest(`/repos/${owner}/${repo}`, {}, token);
  return response.ok;
}

async function createPrivateRepo(owner: string, repoName: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await githubRequest(
      '/user/repos',
      {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          description: 'AniPic private vault - Your personal image storage',
          private: true,
          auto_init: true,
        }),
      },
      token
    );
    
    if (response.ok) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        await githubRequest(
          `/repos/${owner}/${repoName}/contents/images/.gitkeep`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: 'Initialize images folder',
              content: btoa(''),
            }),
          },
          token
        );
      } catch {}
      
      try {
        await githubRequest(
          `/repos/${owner}/${repoName}/contents/metadata.json`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: 'Initialize metadata',
              content: btoa('[]'),
            }),
          },
          token
        );
      } catch {}
      
      try {
        await githubRequest(
          `/repos/${owner}/${repoName}/contents/albums.json`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: 'Initialize albums',
              content: btoa('[]'),
            }),
          },
          token
        );
      } catch {}
      
      return { success: true };
    }
    
    const errorData = await response.json().catch(() => ({}));
    
    if (errorData.errors?.[0]?.message?.includes('name already exists')) {
      return { success: true };
    }
    
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Permission denied. Please sign out and sign in again to grant repository access.' };
    }
    
    if (response.status === 422) {
      return { success: false, error: errorData.message || 'Repository creation failed. The name may be invalid or already exists.' };
    }
    
    console.error('Failed to create repo:', errorData);
    return { success: false, error: errorData.message || 'Failed to create repository' };
  } catch (error) {
    console.error('createPrivateRepo error:', error);
    return { success: false, error: 'Network error while creating repository' };
  }
}

async function updateMetadataFile(
  owner: string,
  repo: string,
  token: string,
  newImage: Omit<ImageMetadata, 'viewUrl' | 'embedUrl'>
): Promise<void> {
  const metadataPath = 'metadata.json';
  let existingMetadata: Omit<ImageMetadata, 'viewUrl' | 'embedUrl'>[] = [];
  let sha: string | undefined;

  try {
    const response = await githubRequest(
      `/repos/${owner}/${repo}/contents/${metadataPath}`,
      {},
      token
    );
    if (response.ok) {
      const data = await response.json();
      sha = data.sha;
      const content = atob(data.content);
      existingMetadata = JSON.parse(content);
    }
  } catch {
    existingMetadata = [];
  }

  existingMetadata.push(newImage);
  const newContent = btoa(JSON.stringify(existingMetadata, null, 2));

  await githubRequest(
    `/repos/${owner}/${repo}/contents/${metadataPath}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `Update metadata for ${newImage.imageId}`,
        content: newContent,
        ...(sha && { sha }),
      }),
    },
    token
  );
}

async function addImageToAlbumInternal(
  imageId: string,
  albumId: string,
  imageSize: number,
  imageUrl: string,
  owner: string,
  token: string
): Promise<boolean> {
  try {
    const reposResponse = await githubRequest(`/users/${owner}/repos?per_page=100`, {}, token);
    if (!reposResponse.ok) return false;
    
    const repos = await reposResponse.json();
    const anipicRepos = repos.filter((r: { name: string }) => 
      r.name.startsWith('anipic-public') || r.name === PRIVATE_REPO_NAME
    );
    
    for (const repo of anipicRepos) {
      try {
        const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
        if (response.ok) {
          const data = await response.json();
          const albums = JSON.parse(atob(data.content));
          const albumIndex = albums.findIndex((a: { id: string }) => a.id === albumId);
          
          if (albumIndex !== -1) {
            if (!albums[albumIndex].images) {
              albums[albumIndex].images = [];
            }
            if (!albums[albumIndex].images.includes(imageId)) {
              albums[albumIndex].images.push(imageId);
              albums[albumIndex].imageCount = albums[albumIndex].images.length;
              albums[albumIndex].totalSize = (albums[albumIndex].totalSize || 0) + imageSize;
              
              if (!albums[albumIndex].coverImage && imageUrl) {
                albums[albumIndex].coverImage = imageUrl;
              }
            }
            
            await githubRequest(
              `/repos/${owner}/${repo.name}/contents/albums.json`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  message: `Add image ${imageId} to album ${albumId}`,
                  content: btoa(JSON.stringify(albums, null, 2)),
                  sha: data.sha,
                }),
              },
              token
            );
            return true;
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploader = (formData.get('uploader') as string) || 'anonymous';
    let driveType = (formData.get('driveType') as string) || 'public';
    const albumId = formData.get('albumId') as string | null;

    const sessionAny = session as any;
    if (sessionAny?.accessToken && sessionAny?.user?.username && driveType === 'public') {
      driveType = 'private';
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    let owner: string;
    let repo: string;
    let token: string;
    let isPrivate = false;
    let uploaderUsername = uploader;

    if (driveType === 'private') {
      if (!sessionAny?.accessToken || !sessionAny?.user?.username) {
        return NextResponse.json(
          { success: false, error: 'You must be signed in to use Private Vault' },
          { status: 401 }
        );
      }
      
      owner = sessionAny.user.username;
      repo = PRIVATE_REPO_NAME;
      token = sessionAny.accessToken;
      isPrivate = true;
      uploaderUsername = sessionAny.user.username;
      
      const repoExists = await checkRepoExists(owner, repo, token);
        if (!repoExists) {
          const result = await createPrivateRepo(owner, repo, token);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: result.error || 'Failed to create private vault repository' },
              { status: 500 }
            );
          }
        }
    } else {
      owner = PUBLIC_REPO_OWNER;
      repo = PUBLIC_REPO_BASE;
      token = PUBLIC_GITHUB_TOKEN;
    }

    const imageId = await ensureUniqueId(owner, repo, token);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${imageId}.${extension}`;
    const path = `images/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');

    const uploadResponse = await githubRequest(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: `Upload image ${imageId}`,
          content: base64Content,
        }),
      },
      token
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to upload image to GitHub' },
        { status: 500 }
      );
    }

    const uploadData = await uploadResponse.json();
    const rawUrl = uploadData.content.download_url;

    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const metadata: ImageMetadata = {
      imageId,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      uploader: uploaderUsername,
      size: file.size,
      mimeType: file.type,
      repository: repo,
      rawUrl,
      viewUrl: `${baseUrl}/i/${imageId}`,
      embedUrl: `${baseUrl}/e/${imageId}`,
      isPrivate,
      albumId: albumId && albumId !== 'default' ? albumId : undefined,
    };

    await updateMetadataFile(owner, repo, token, {
      imageId: metadata.imageId,
      filename: metadata.filename,
      uploadedAt: metadata.uploadedAt,
      uploader: metadata.uploader,
      size: metadata.size,
      mimeType: metadata.mimeType,
      repository: metadata.repository,
      rawUrl: metadata.rawUrl,
      isPrivate: metadata.isPrivate,
      albumId: metadata.albumId,
    });

    if (albumId && albumId !== 'default') {
      await addImageToAlbumInternal(
        imageId, 
        albumId, 
        file.size, 
        rawUrl,
        isPrivate ? owner : PUBLIC_REPO_OWNER,
        isPrivate ? token : PUBLIC_GITHUB_TOKEN
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageId: metadata.imageId,
        filename: metadata.filename,
        size: metadata.size,
        mimeType: metadata.mimeType,
        uploadedAt: metadata.uploadedAt,
        uploader: metadata.uploader,
        isPrivate: metadata.isPrivate,
        links: {
          view: metadata.viewUrl,
          embed: metadata.embedUrl,
          raw: metadata.rawUrl,
          direct: rawUrl,
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
