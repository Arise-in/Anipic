"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  FileType,
  Link2,
  Settings,
  User,
  Code,
  Share2,
  Hash,
  Maximize2,
} from "lucide-react";
import { getImageById, formatFileSize, getRelativeTime, type ImageMetadata } from "@/lib/github";
import { useSettings } from "@/lib/settings-context";
import Logo from "@/components/Logo";

type ImageOrientation = "landscape" | "portrait" | "square";

function getImageOrientation(width: number, height: number): ImageOrientation {
  const ratio = width / height;
  if (ratio > 1.2) return "landscape";
  if (ratio < 0.8) return "portrait";
  return "square";
}

export default function ImagePage({ params }: { params: Promise<{ imageId: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const [image, setImage] = useState<ImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [orientation, setOrientation] = useState<ImageOrientation>("landscape");
  const { getEmbedLink, settings } = useSettings();

  useEffect(() => {
    if (status === 'loading') return;
    
    const loadImage = async () => {
      setIsLoading(true);
      
      let vaultImages: ImageMetadata[] = [];
      if (session) {
        try {
          const vaultRes = await fetch('/api/v1/user/vault');
          if (vaultRes.ok) {
            const vaultData = await vaultRes.json();
            vaultImages = vaultData.data?.images || [];
          }
        } catch (e) {
          console.error('Failed to fetch vault:', e);
        }
      }
      
      const imageData = await getImageById(resolvedParams.imageId, vaultImages);
      setImage(imageData);
      setIsLoading(false);
    };
    loadImage();
  }, [resolvedParams.imageId, session, status]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setOrientation(getImageOrientation(img.naturalWidth, img.naturalHeight));
    setImageLoaded(true);
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getViewUrl = () => `${window.location.origin}/i/${resolvedParams.imageId}`;
  const getEmbed = () => image ? getEmbedLink(image.imageId, image.rawUrl) : "";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-rose-500/20 border-t-rose-500" />
      </div>
    );
  }

  if (!image) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <div className="glass-strong rounded-2xl p-8 sm:p-10 text-center max-w-md w-full">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <ImageIcon className="h-8 w-8 text-white/20" />
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-white">IMAGE NOT FOUND</h1>
          <p className="mb-6 text-sm text-white/50">
            The image <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-rose-500">{resolvedParams.imageId}</code> doesn&apos;t exist.
          </p>
          <a href="/" className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-3 font-medium text-white hover:bg-rose-500 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const fileExtension = image.filename.split('.').pop()?.toUpperCase() || 'IMG';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="fixed left-0 right-0 top-0 z-40">
        <div className="glass border-b border-white/5">
          <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4">
            <a href="/">
              <Logo size="sm" />
            </a>

            <div className="flex items-center gap-2">
              <a href="/settings" className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors">
                <Settings className="h-4 w-4" />
              </a>
              <a href="/" className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:pt-32">
        <div className={`flex flex-col gap-6 ${
          orientation === "portrait" ? "lg:flex-row" : "flex-col"
        }`}>
          <div className={`glass rounded-2xl p-6 sm:p-8 overflow-hidden flex-1 flex flex-col items-center justify-center min-h-[50vh] ${
            orientation === "portrait" ? "lg:max-w-[60%]" : "w-full"
          }`}>
            <div className={`relative flex items-center justify-center w-full ${
              orientation === "landscape" ? "max-h-[70vh]" : orientation === "portrait" ? "max-h-[85vh]" : "max-h-[60vh]"
            }`}>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-rose-500/20 border-t-rose-500" />
                </div>
              )}
              <img
                src={image.rawUrl}
                alt={image.filename}
                className={`max-h-full max-w-full object-contain rounded-lg transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={handleImageLoad}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-white/70">{fileExtension}</span>
                {imageDimensions && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Maximize2 className="h-3 w-3" />
                    {imageDimensions.width} × {imageDimensions.height}
                  </span>
                )}
              </div>
              <span className="text-xs text-white/40">{formatFileSize(image.size)}</span>
            </div>
          </div>

            <div className={`grid gap-4 sm:gap-6 flex-1 ${orientation === "portrait" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              <div className="bento-item col-span-full">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Metadata</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <code className="font-mono text-2xl sm:text-3xl font-bold text-rose-500 break-all">{image.imageId}</code>
                    <p className="mt-1 text-sm text-white/30 truncate">{image.filename}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="glass-button rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-[10px] text-white/30 uppercase font-bold">Size</span>
                      <span className="text-sm font-bold text-white">{formatFileSize(image.size)}</span>
                    </div>
                    <div className="glass-button rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-[10px] text-white/30 uppercase font-bold">Format</span>
                      <span className="text-sm font-bold text-white">{fileExtension}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bento-item">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Timeline</span>
                </div>
                <p className="text-lg font-bold text-white">{getRelativeTime(image.uploadedAt)}</p>
                <p className="text-xs text-white/30 mt-1">{new Date(image.uploadedAt).toLocaleString()}</p>
              </div>

              <div className="bento-item">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Uploader</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {image.uploader?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white truncate">{image.uploader || 'Anonymous'}</p>
                    <p className="text-xs text-white/30">Verified User</p>
                  </div>
                </div>
              </div>

              <div className="bento-item">
                <div className="flex items-center gap-2 mb-3">
                  <Maximize2 className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Resolution</span>
                </div>
                {imageDimensions ? (
                  <>
                    <p className="text-lg font-bold text-white">{imageDimensions.width} × {imageDimensions.height}</p>
                    <p className="text-xs text-white/30 mt-1">{orientation.toUpperCase()} ASPECT</p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-white/20">Detecting...</p>
                )}
              </div>

              <div className="bento-item col-span-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Embed Link</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold uppercase">
                      {settings.linkPreference === "temp" ? "Custom Domain" : "GitHub Raw"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-4 group/link transition-all hover:bg-white/10">
                  <code className="flex-1 truncate font-mono text-base text-rose-400">{getEmbed()}</code>
                  <button
                    onClick={() => copyToClipboard(getEmbed(), "embed")}
                    className="shrink-0 btn-primary rounded-xl p-3 hover:scale-105 transition-transform"
                  >
                    {copied === "embed" ? <Check className="h-5 w-5 text-white" /> : <Copy className="h-5 w-5 text-white" />}
                  </button>
                </div>
              </div>

              <div className="bento-item col-span-full">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Quick Export</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "HTML Tag", code: `<img src="${getEmbed()}" alt="AniPic" />`, key: "html" },
                    { label: "Markdown", code: `![AniPic](${getEmbed()})`, key: "md" },
                    { label: "BBCode", code: `[img]${getEmbed()}[/img]`, key: "bb" },
                  ].map((item) => (
                    <div key={item.key} className="group/item relative">
                      <p className="mb-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.label}</p>
                      <div className="rounded-xl bg-white/5 p-4 font-mono text-xs text-white/50 overflow-x-auto border border-white/5 group-hover/item:border-white/10 transition-colors">
                        <code className="break-all whitespace-pre-wrap">{item.code}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.code, item.key)}
                        className="absolute right-2 top-8 opacity-0 group-hover/item:opacity-100 transition-all rounded-lg bg-white/10 p-2 hover:bg-white/20"
                      >
                        {copied === item.key ? <Check className="h-4 w-4 text-rose-400" /> : <Copy className="h-4 w-4 text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bento-item col-span-full">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Actions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => copyToClipboard(getEmbed(), "quick")}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-rose-600/10 border border-rose-500/20 py-4 text-sm font-bold text-rose-500 hover:bg-rose-600 hover:text-white transition-all group"
                  >
                    {copied === "quick" ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6 transition-transform group-hover:scale-110" />}
                    Copy Link
                  </button>
                  <a
                    href={image.rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 py-4 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                  >
                    <ExternalLink className="h-6 w-6 transition-transform group-hover:scale-110" />
                    Open Raw
                  </a>
                  <a
                    href={image.rawUrl}
                    download={image.filename}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 py-4 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                  >
                    <Download className="h-6 w-6 transition-transform group-hover:scale-110" />
                    Download
                  </a>
                  <a
                    href="/gallery"
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 py-4 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all group"
                  >
                    <ImageIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    All Images
                  </a>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
