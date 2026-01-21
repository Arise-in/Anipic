export const PUBLIC_GITHUB_TOKEN = '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';
export const PUBLIC_REPO_OWNER = 'Arise-in';
export const PUBLIC_REPO_BASE = 'anipic-public';
export const REPO_SIZE_THRESHOLD = 800 * 1024 * 1024;
export const MAX_REPO_SIZE = 1024 * 1024 * 1024;
export const MAX_REPOS = 10;

const repoCache = new Map<string, { data: RepoInfo[]; timestamp: number }>();
const imageCache = new Map<string, { data: ImageMetadata[]; timestamp: number }>();
const CACHE_TTL = 30000;

export interface ImageMetadata {
  imageId: string;
  filename: string;
  uploadedAt: string;
  uploader: string;
  size: number;
  dimensions?: string;
  mimeType: string;
  repository: string;
  rawUrl: string;
  isPrivate?: boolean;
}

export interface RepoInfo {
  name: string;
  size: number;
  fullName: string;
  imageCount: number;
  createdAt?: string;
}

export interface StorageStats {
  totalUsed: number;
  totalCapacity: number;
  repos: RepoInfo[];
  imageCount: number;
  percentUsed: number;
  availableSpace: number;
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
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

export async function getRepoSize(owner: string, repo: string, token?: string): Promise<number> {
  const response = await githubRequest(`/repos/${owner}/${repo}`, {}, token);
  if (!response.ok) return 0;
  const data = await response.json();
  return (data.size || 0) * 1024;
}

export async function checkRepoExists(owner: string, repo: string, token?: string): Promise<boolean> {
  const response = await githubRequest(`/repos/${owner}/${repo}`, {}, token);
  return response.ok;
}

export async function listUserRepos(owner: string, token?: string): Promise<RepoInfo[]> {
  const cacheKey = `${owner}-${token || 'public'}`;
  const cached = repoCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const response = await githubRequest(
      `/users/${owner}/repos?per_page=100&sort=created`,
      {},
      token
    );
    if (!response.ok) {
      repoCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }
    const repos = await response.json();
    if (!Array.isArray(repos)) {
      repoCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }
    
    const anipicRepos = repos.filter((r: { name: string }) => 
      r.name.startsWith('anipic-public')
    );
    
    if (anipicRepos.length === 0) {
      repoCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }
    
    const repoInfos: RepoInfo[] = [];
    
    for (const repo of anipicRepos) {
      let imageCount = 0;
      try {
        const metaResponse = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo.name}/main/metadata.json`,
          { cache: 'no-store' }
        );
        if (metaResponse.ok) {
          const metadata = await metaResponse.json();
          imageCount = Array.isArray(metadata) ? metadata.length : 0;
        }
      } catch {
        imageCount = 0;
      }
      
      repoInfos.push({
        name: repo.name,
        fullName: repo.full_name,
        size: repo.size * 1024,
        imageCount,
        createdAt: repo.created_at,
      });
    }
    
    repoCache.set(cacheKey, { data: repoInfos, timestamp: Date.now() });
    return repoInfos;
  } catch {
    repoCache.set(cacheKey, { data: [], timestamp: Date.now() });
    return [];
  }
}

export async function getStorageStats(owner: string = PUBLIC_REPO_OWNER, token?: string): Promise<StorageStats> {
  const repos = await listUserRepos(owner, token);
  const totalUsed = repos.reduce((acc, r) => acc + r.size, 0);
  const imageCount = repos.reduce((acc, r) => acc + r.imageCount, 0);
  const totalCapacity = MAX_REPOS * MAX_REPO_SIZE;
  
  return {
    totalUsed,
    totalCapacity,
    repos,
    imageCount,
    percentUsed: (totalUsed / totalCapacity) * 100,
    availableSpace: totalCapacity - totalUsed,
  };
}

export async function findAvailableRepo(owner: string, token?: string): Promise<string> {
  const repos = await listUserRepos(owner, token);
  
  for (const repo of repos) {
    if (repo.size < REPO_SIZE_THRESHOLD) {
      return repo.name;
    }
  }
  
  const nextIndex = repos.length > 0 ? repos.length + 1 : 1;
  const newRepoName = `${PUBLIC_REPO_BASE}-${nextIndex}`;
  
  return newRepoName;
}

export async function ensureRepoExists(
  owner: string, 
  repoName: string, 
  token: string
): Promise<boolean> {
  const exists = await checkRepoExists(owner, repoName, token);
  if (exists) {
    const metadataExists = await checkMetadataExists(owner, repoName, token);
    if (!metadataExists) {
      await initializeRepoFiles(owner, repoName, token);
    }
    return true;
  }
  return await createNewRepo(owner, repoName, token);
}

async function checkMetadataExists(owner: string, repo: string, token?: string): Promise<boolean> {
  try {
    const response = await githubRequest(`/repos/${owner}/${repo}/contents/metadata.json`, {}, token);
    return response.ok;
  } catch {
    return false;
  }
}

async function initializeRepoFiles(owner: string, repoName: string, token: string): Promise<void> {
  try {
    const gitkeepResponse = await githubRequest(`/repos/${owner}/${repoName}/contents/images/.gitkeep`, {}, token);
    if (!gitkeepResponse.ok) {
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
    }
  } catch {}
  
  try {
    const metaResponse = await githubRequest(`/repos/${owner}/${repoName}/contents/metadata.json`, {}, token);
    if (!metaResponse.ok) {
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
    }
  } catch {}
}

export async function createNewRepo(owner: string, repoName: string, token: string): Promise<boolean> {
  try {
    const response = await githubRequest(
      '/user/repos',
      {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          description: 'AniPic image storage repository',
          private: false,
          auto_init: true,
        }),
      },
      token
    );
    
    if (response.ok) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getExistingImageIds(owner: string, repo: string, token?: string): Promise<string[]> {
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

export async function ensureUniqueId(owner: string, repo: string, token?: string): Promise<string> {
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

export async function uploadImageToGitHub(
  file: File,
  owner: string = PUBLIC_REPO_OWNER,
  repo: string = PUBLIC_REPO_BASE,
  token: string = PUBLIC_GITHUB_TOKEN,
  uploader: string = 'anonymous'
): Promise<ImageMetadata> {
  const repoExists = await ensureRepoExists(owner, repo, token);
  if (!repoExists) {
    throw new Error('Failed to create or access repository');
  }
  
  const imageId = await ensureUniqueId(owner, repo, token);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${imageId}.${extension}`;
  const path = `images/${filename}`;

  const base64Content = await fileToBase64(file);

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
    throw new Error(error.message || 'Failed to upload image');
  }

  const uploadData = await uploadResponse.json();
  const rawUrl = uploadData.content.download_url;

  const metadata: ImageMetadata = {
    imageId,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
    uploader,
    size: file.size,
    mimeType: file.type,
    repository: repo,
    rawUrl,
  };

  await updateMetadataFile(owner, repo, token, metadata);

  return metadata;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

async function updateMetadataFile(
  owner: string,
  repo: string,
  token: string,
  newImage: ImageMetadata
): Promise<void> {
  const metadataPath = 'metadata.json';
  let existingMetadata: ImageMetadata[] = [];
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
  
  invalidateCache();
}

export async function getPublicImages(): Promise<ImageMetadata[]> {
  const cacheKey = 'public-images';
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const repos = await listUserRepos(PUBLIC_REPO_OWNER);
    
    if (!repos || repos.length === 0) {
      imageCache.set(cacheKey, { data: [], timestamp: Date.now() });
      return [];
    }
    
    const allImages: ImageMetadata[] = [];
    
    for (const repo of repos) {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${PUBLIC_REPO_OWNER}/${repo.name}/main/metadata.json`,
          { cache: 'no-store' }
        );
        if (response.ok) {
          const metadata: ImageMetadata[] = await response.json();
          if (Array.isArray(metadata)) {
            const publicImages = metadata.filter(img => !img.isPrivate);
            allImages.push(...publicImages);
          }
        }
      } catch {
      }
    }
    
    const sortedImages = allImages.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    imageCache.set(cacheKey, { data: sortedImages, timestamp: Date.now() });
    return sortedImages;
  } catch {
    imageCache.set(cacheKey, { data: [], timestamp: Date.now() });
    return [];
  }
}

export function invalidateCache(): void {
  repoCache.clear();
  imageCache.clear();
}

export async function getUserImages(username: string): Promise<ImageMetadata[]> {
  try {
    const allImages = await getPublicImages();
    return allImages.filter(img => img.uploader === username);
  } catch {
    return [];
  }
}

export async function getUserAlbums(username: string): Promise<AlbumMetadata[]> {
  try {
    const allAlbums = await getAlbums();
    return allAlbums.filter(album => album.owner === username);
  } catch {
    return [];
  }
}

export async function getImageById(imageId: string, vaultImages?: ImageMetadata[]): Promise<ImageMetadata | null> {
  try {
    const publicImages = await getPublicImages();
    let found = publicImages.find(img => img.imageId === imageId);
    if (found) return found;
    
    if (vaultImages && vaultImages.length > 0) {
      found = vaultImages.find(img => img.imageId === imageId);
      if (found) return found;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function deleteImage(
  imageId: string,
  owner: string,
  repo: string,
  token: string
): Promise<boolean> {
  try {
    const metadataResponse = await githubRequest(
      `/repos/${owner}/${repo}/contents/metadata.json`,
      {},
      token
    );
    if (!metadataResponse.ok) return false;
    
    const metadataData = await metadataResponse.json();
    const metadataContent = atob(metadataData.content);
    const metadata: ImageMetadata[] = JSON.parse(metadataContent);
    const image = metadata.find(img => img.imageId === imageId);
    
    if (!image) return false;

    const extension = image.filename.split('.').pop() || 'jpg';
    const imagePath = `images/${imageId}.${extension}`;
    
    const imageFileResponse = await githubRequest(
      `/repos/${owner}/${repo}/contents/${imagePath}`,
      {},
      token
    );
    if (!imageFileResponse.ok) return false;
    
    const imageFileData = await imageFileResponse.json();
    
    await githubRequest(
      `/repos/${owner}/${repo}/contents/${imagePath}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete image ${imageId}`,
          sha: imageFileData.sha,
        }),
      },
      token
    );

    const updatedMetadata = metadata.filter(img => img.imageId !== imageId);
    const newMetadataContent = btoa(JSON.stringify(updatedMetadata, null, 2));
    
    await githubRequest(
      `/repos/${owner}/${repo}/contents/metadata.json`,
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

    return true;
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

export interface AlbumMetadata {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
  imageCount: number;
  totalSize: number;
  repository: string;
  tags: string[];
  owner: string;
  images: string[];
}

export async function getAlbums(owner: string = PUBLIC_REPO_OWNER, token?: string): Promise<AlbumMetadata[]> {
  const repos = await listUserRepos(owner, token);
  let allAlbums: AlbumMetadata[] = [];
  
  for (const repo of repos) {
    try {
      const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
      if (response.ok) {
        const data = await response.json();
        const content = atob(data.content);
        const albums: AlbumMetadata[] = JSON.parse(content);
        const normalizedAlbums = albums.map(album => ({
          ...album,
          images: album.images || [],
          owner: album.owner || 'anonymous',
        }));
        allAlbums = [...allAlbums, ...normalizedAlbums];
      }
    } catch (e) {
      console.error(`Failed to load albums for ${repo.name}`, e);
    }
  }
  
  return allAlbums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createAlbum(
  name: string,
  description: string = '',
  tags: string[] = [],
  owner: string = PUBLIC_REPO_OWNER,
  token: string = PUBLIC_GITHUB_TOKEN,
  creatorUsername: string = 'anonymous'
): Promise<AlbumMetadata | null> {
  const repo = await findAvailableRepo(owner, token);
  
  const newAlbum: AlbumMetadata = {
    id: generateUniqueId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    imageCount: 0,
    totalSize: 0,
    repository: repo,
    tags,
    owner: creatorUsername,
    images: [],
  };
  
  let repoAlbums: AlbumMetadata[] = [];
  let sha: string | undefined;
  
  try {
    const response = await githubRequest(`/repos/${owner}/${repo}/contents/albums.json`, {}, token);
    if (response.ok) {
      const data = await response.json();
      sha = data.sha;
      repoAlbums = JSON.parse(atob(data.content));
    }
  } catch (e) {}
  
  repoAlbums.push(newAlbum);
  
  const updateResponse = await githubRequest(
    `/repos/${owner}/${repo}/contents/albums.json`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `Create album ${name}`,
        content: btoa(JSON.stringify(repoAlbums, null, 2)),
        ...(sha && { sha }),
      }),
    },
    token
  );
  
  return updateResponse.ok ? newAlbum : null;
}

export async function addImageToAlbum(
  imageId: string,
  albumId: string,
  imageSize: number = 0,
  imageUrl: string = '',
  owner: string = PUBLIC_REPO_OWNER,
  token: string = PUBLIC_GITHUB_TOKEN
): Promise<boolean> {
  const repos = await listUserRepos(owner, token);
  
  for (const repo of repos) {
    try {
      const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
      if (response.ok) {
        const data = await response.json();
        const albums: AlbumMetadata[] = JSON.parse(atob(data.content));
        const albumIndex = albums.findIndex(a => a.id === albumId);
        
        if (albumIndex !== -1) {
          if (!albums[albumIndex].images.includes(imageId)) {
            albums[albumIndex].images.push(imageId);
            albums[albumIndex].imageCount = albums[albumIndex].images.length;
            albums[albumIndex].totalSize += imageSize;
            
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
  return false;
}

export async function removeImageFromAlbum(
  imageId: string,
  albumId: string,
  owner: string = PUBLIC_REPO_OWNER,
  token: string = PUBLIC_GITHUB_TOKEN
): Promise<boolean> {
  const repos = await listUserRepos(owner, token);
  
  for (const repo of repos) {
    try {
      const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
      if (response.ok) {
        const data = await response.json();
        const albums: AlbumMetadata[] = JSON.parse(atob(data.content));
        const albumIndex = albums.findIndex(a => a.id === albumId);
        
        if (albumIndex !== -1) {
          const imageIndex = albums[albumIndex].images.indexOf(imageId);
          if (imageIndex > -1) {
            albums[albumIndex].images.splice(imageIndex, 1);
            albums[albumIndex].imageCount = albums[albumIndex].images.length;
            
            if (albums[albumIndex].coverImage?.includes(imageId)) {
              albums[albumIndex].coverImage = undefined;
            }
            
            await githubRequest(
              `/repos/${owner}/${repo.name}/contents/albums.json`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  message: `Remove image ${imageId} from album ${albumId}`,
                  content: btoa(JSON.stringify(albums, null, 2)),
                  sha: data.sha,
                }),
              },
              token
            );
            return true;
          }
        }
      }
    } catch (e) {}
  }
  return false;
}

export async function renameAlbum(
  albumId: string,
  newName: string,
  owner: string = PUBLIC_REPO_OWNER,
  token: string = PUBLIC_GITHUB_TOKEN
): Promise<boolean> {
  const repos = await listUserRepos(owner, token);
  
  for (const repo of repos) {
    try {
      const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
      if (response.ok) {
        const data = await response.json();
        const albums: AlbumMetadata[] = JSON.parse(atob(data.content));
        const albumIndex = albums.findIndex(a => a.id === albumId);
        
        if (albumIndex !== -1) {
          albums[albumIndex].name = newName;
          
          await githubRequest(
            `/repos/${owner}/${repo.name}/contents/albums.json`,
            {
              method: 'PUT',
              body: JSON.stringify({
                message: `Rename album to ${newName}`,
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
  return false;
}

export async function deleteAlbum(
  albumId: string,
  owner: string = PUBLIC_REPO_OWNER,
  token: string = PUBLIC_GITHUB_TOKEN
): Promise<boolean> {
  const repos = await listUserRepos(owner, token);
  
  for (const repo of repos) {
    try {
      const response = await githubRequest(`/repos/${owner}/${repo.name}/contents/albums.json`, {}, token);
      if (response.ok) {
        const data = await response.json();
        const albums: AlbumMetadata[] = JSON.parse(atob(data.content));
        const albumIndex = albums.findIndex(a => a.id === albumId);
        
        if (albumIndex !== -1) {
          albums.splice(albumIndex, 1);
          
          await githubRequest(
            `/repos/${owner}/${repo.name}/contents/albums.json`,
            {
              method: 'PUT',
              body: JSON.stringify({
                message: `Delete album ${albumId}`,
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
  return false;
}

export async function getAlbumById(
  albumId: string,
  owner: string = PUBLIC_REPO_OWNER,
  token?: string
): Promise<AlbumMetadata | null> {
  const albums = await getAlbums(owner, token);
  return albums.find(a => a.id === albumId) || null;
}

export async function getAlbumImages(
  albumId: string,
  owner: string = PUBLIC_REPO_OWNER,
  token?: string
): Promise<ImageMetadata[]> {
  const album = await getAlbumById(albumId, owner, token);
  if (!album || !album.images || album.images.length === 0) return [];
  
  const allImages = await getPublicImages();
  return allImages.filter(img => album.images.includes(img.imageId));
}

