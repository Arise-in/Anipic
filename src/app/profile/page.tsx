"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import {
  ArrowLeft,
  Image as ImageIcon,
  User,
  Mail,
  Github,
  LogOut,
  Settings,
  HardDrive,
  Calendar,
  ExternalLink,
  FolderOpen,
  Database,
  TrendingUp,
  ChevronRight,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { 
  getPublicImages, 
  getStorageStats, 
  formatFileSize, 
  type ImageMetadata, 
  type StorageStats,
  MAX_REPO_SIZE,
  MAX_REPOS,
} from "@/lib/github";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userImages, setUserImages] = useState<ImageMetadata[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [allImages, stats] = await Promise.all([
        getPublicImages(),
        getStorageStats(),
      ]);
      
      if (session?.user?.name) {
        const filtered = allImages.filter(
          (img) => img.uploader === session.user?.name || img.uploader === (session.user as { username?: string })?.username
        );
        setUserImages(filtered);
      } else {
        setUserImages(allImages);
      }
      setStorageStats(stats);
      setIsLoading(false);
    };
    loadData();
  }, [session]);

  const totalSize = userImages.reduce((acc, img) => acc + img.size, 0);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030304]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="fixed left-0 right-0 top-0 z-40 header-blur border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25 transition-transform duration-300 group-hover:scale-105">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-heading text-xl font-bold text-white tracking-tight">
              Ani<span className="text-gradient-vibrant">Pic</span>
            </span>
          </a>

          <a
            href="/"
            className="glass-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-20 pt-24">
        <div className="glass-card rounded-3xl p-6 sm:p-8 animate-fade-up">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-6">
            <div className="relative shrink-0">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-24 w-24 rounded-2xl ring-4 ring-rose-500/20 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-[#030304] flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
                {session?.user?.name || "Anonymous User"}
              </h1>
              {(session?.user as { username?: string })?.username && (
                <p className="text-rose-400 font-mono mt-1">
                  @{(session.user as { username?: string }).username}
                </p>
              )}
              {session?.user?.email && (
                <p className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-white/50 text-sm">
                  <Mail className="h-4 w-4" />
                  {session.user.email}
                </p>
              )}
            </div>

            {session && (
              <div className="flex flex-wrap justify-center gap-2 sm:flex-col">
                <a
                  href="/gallery"
                  className="glass-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  <FolderOpen className="h-4 w-4" />
                  Gallery
                </a>
                <a
                  href="/settings"
                  className="glass-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ImageIcon, label: "Total Images", value: userImages.length, color: "text-rose-400" },
            { icon: HardDrive, label: "Storage Used", value: formatFileSize(totalSize), color: "text-orange-400" },
            { icon: Database, label: "Active Repos", value: storageStats?.repos.length || 1, color: "text-violet-400" },
            { icon: TrendingUp, label: "Available", value: storageStats ? formatFileSize(storageStats.availableSpace) : "10 GB", color: "text-emerald-400" },
          ].map((stat, i) => (
            <div 
              key={stat.label} 
              className="stat-card rounded-2xl p-5 animate-fade-up backdrop-blur-sm" 
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="feature-icon flex h-12 w-12 items-center justify-center rounded-xl">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-white/40 font-body">{stat.label}</p>
                  <p className="text-xl font-bold text-white font-heading">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {storageStats && (
          <div className="mt-6 glass-card rounded-2xl p-6 animate-fade-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="feature-icon flex h-12 w-12 items-center justify-center rounded-xl">
                  <Database className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-lg">Storage Overview</h2>
                  <p className="text-sm text-white/50">Multi-repo storage system</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white font-display">
                  {storageStats.percentUsed.toFixed(1)}%
                </p>
                <p className="text-xs text-white/40">of {formatFileSize(storageStats.totalCapacity)}</p>
              </div>
            </div>

            <div className="storage-bar h-3 mb-6">
              <div 
                className="storage-fill h-full" 
                style={{ width: `${Math.min(storageStats.percentUsed, 100)}%` }} 
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Repository Details</p>
              {storageStats.repos.length > 0 ? (
                storageStats.repos.map((repo, i) => {
                  const repoPercent = (repo.size / MAX_REPO_SIZE) * 100;
                  const isNearFull = repoPercent > 80;
                  
                  return (
                    <div 
                      key={repo.name} 
                      className="rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${isNearFull ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <span className="text-sm font-medium text-white">{repo.name}</span>
                          {isNearFull && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Near full
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-white/40">{repo.imageCount} images</span>
                          <span className="text-sm text-white/70 font-mono">{formatFileSize(repo.size)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isNearFull ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
                          style={{ width: `${Math.min(repoPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/30">{repoPercent.toFixed(1)}% used</span>
                        <span className="text-xs text-white/30">{formatFileSize(MAX_REPO_SIZE - repo.size)} free</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl bg-white/5 border border-white/5 p-6 text-center">
                  <p className="text-white/50">No repositories found</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/40">
                  <Plus className="h-4 w-4" />
                  <span>Auto-scaling enabled</span>
                </div>
                <span className="text-white/50">
                  {storageStats.repos.length} of {MAX_REPOS} repos used
                </span>
              </div>
              <p className="text-xs text-white/30 mt-2">
                New repositories are automatically created when current ones reach 800MB
              </p>
            </div>
          </div>
        )}

        {session && (
          <div className="mt-6 glass-card rounded-2xl p-6 animate-fade-up" style={{ animationDelay: "350ms" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="feature-icon flex h-12 w-12 items-center justify-center rounded-xl">
                  <Github className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">GitHub Connection</h2>
                  <p className="text-sm text-white/50">Linked account</p>
                </div>
              </div>
              <a
                href={`https://github.com/${(session.user as { username?: string })?.username || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
              >
                <ExternalLink className="h-4 w-4" />
                View Profile
              </a>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-white font-medium">Connected</span>
                </div>
                <span className="text-sm text-white/50 font-mono">
                  @{(session.user as { username?: string })?.username || session.user?.name}
                </span>
              </div>
            </div>
          </div>
        )}

        {!session && (
          <div className="mt-6 glass-card rounded-3xl p-10 text-center animate-fade-up" style={{ animationDelay: "250ms" }}>
            <div className="feature-icon mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl">
              <Github className="h-10 w-10 text-white" />
            </div>
              <h2 className="mb-3 text-2xl font-semibold text-white font-heading">Sign in to manage your images</h2>
            <p className="mb-8 text-white/50">
              Connect your GitHub account to upload images and access your personal gallery
            </p>
            <button
              onClick={() => signIn("github")}
              className="btn-primary inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold text-white"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-rose-500" />
          </div>
        ) : userImages.length > 0 ? (
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white font-heading">Recent Uploads</h2>
              <a
                href="/gallery"
                className="text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userImages.slice(0, 6).map((image, i) => (
                <a
                  key={image.imageId}
                  href={`/i/${image.imageId}`}
                  className="glass-card overflow-hidden rounded-2xl group"
                  style={{ animationDelay: `${450 + i * 50}ms` }}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={image.rawUrl}
                      alt={image.filename}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <code className="font-mono text-sm font-semibold text-rose-400">{image.imageId}</code>
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
