"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  HardDrive,
  Database,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  uploadImageToGitHub,
  getPublicImages,
  deleteImage,
  formatFileSize,
  type ImageMetadata,
  PUBLIC_GITHUB_TOKEN,
  PUBLIC_REPO_OWNER,
  PUBLIC_REPO_BASE,
} from "@/lib/github";

export default function DashboardPage() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    const publicImages = await getPublicImages();
    setImages(publicImages);
    setIsLoading(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => new Map(prev).set(fileId, 0));

      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId) || 0;
          if (current < 90) {
            newMap.set(fileId, current + Math.random() * 15);
          }
          return newMap;
        });
      }, 200);

      try {
        const metadata = await uploadImageToGitHub(file);
        clearInterval(progressInterval);
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
        setImages((prev) => [metadata, ...prev]);
      } catch (error) {
        clearInterval(progressInterval);
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
        console.error("Upload failed:", error);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
    },
    maxSize: 25 * 1024 * 1024,
  });

  const handleDelete = async (imageId: string) => {
    setIsDeleting(true);
    const success = await deleteImage(
      imageId,
      PUBLIC_REPO_OWNER,
      PUBLIC_REPO_BASE,
      PUBLIC_GITHUB_TOKEN
    );
    if (success) {
      setImages((prev) => prev.filter((img) => img.imageId !== imageId));
    }
    setDeleteConfirm(null);
    setIsDeleting(false);
  };

  const copyToClipboard = async (imageId: string) => {
    const url = `${window.location.origin}/i/${imageId}`;
    await navigator.clipboard.writeText(url);
  };

  const totalSize = images.reduce((acc, img) => acc + img.size, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="fixed left-0 right-0 top-0 z-40">
        <div className="glass border-b border-white/5">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff0040]">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Ani<span className="text-[#ff0040]">Pic</span>
              </span>
            </a>

            <a
              href="/"
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60">Manage your uploaded images</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0040]/20">
                <ImageIcon className="h-5 w-5 text-[#ff0040]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Total Images</p>
                <p className="text-2xl font-bold text-white">{images.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0040]/20">
                <HardDrive className="h-5 w-5 text-[#ff0040]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Storage Used</p>
                <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0040]/20">
                <Database className="h-5 w-5 text-[#ff0040]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Repository</p>
                <p className="text-lg font-bold text-white">{PUBLIC_REPO_BASE}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          {...getRootProps()}
          className={`glass mb-8 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            isDragActive
              ? "drop-zone-active border-[#ff0040]"
              : "border-white/20 hover:border-[#ff0040]/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff0040]/20">
            <Upload className="h-8 w-8 text-[#ff0040]" />
          </div>
          <p className="text-lg font-medium text-white">
            {isDragActive ? "Drop images here" : "Drag & drop images here"}
          </p>
          <p className="text-sm text-white/60">or click to browse</p>
        </motion.div>

        {uploadingFiles.size > 0 && (
          <div className="mb-8 space-y-3">
            {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
              <div key={fileId} className="glass rounded-xl p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#ff0040]" />
                  <span className="text-sm text-white">Uploading...</span>
                  <span className="ml-auto text-sm text-white/60">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="progress-bar h-full rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Images</h2>
          <span className="text-sm text-white/40">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff0040] border-t-transparent" />
          </div>
        ) : images.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <DashboardImageCard
                key={image.imageId}
                image={image}
                index={index}
                onCopy={copyToClipboard}
                onDelete={() => setDeleteConfirm(image.imageId)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
              <ImageIcon className="h-12 w-12 text-white/20" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">No images yet</h3>
            <p className="text-white/60">Upload your first image to get started</p>
          </div>
        )}
      </main>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass relative w-full max-w-md rounded-2xl p-6"
          >
            <button
              onClick={() => setDeleteConfirm(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Image</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>

            <p className="mb-6 text-white/80">
              Are you sure you want to delete image{" "}
              <code className="rounded bg-white/10 px-2 py-1 font-mono text-[#ff0040]">
                {deleteConfirm}
              </code>
              ? This will permanently remove the image.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DashboardImageCard({
  image,
  index,
  onCopy,
  onDelete,
}: {
  image: ImageMetadata;
  index: number;
  onCopy: (imageId: string) => void;
  onDelete: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(image.imageId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass glass-hover overflow-hidden rounded-xl"
    >
      <div className="relative aspect-video">
        {!loaded && (
          <div className="flex h-full items-center justify-center bg-white/5">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff0040] border-t-transparent" />
          </div>
        )}
        <a href={`/i/${image.imageId}`}>
          <img
            src={image.rawUrl}
            alt={image.filename}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
            onLoad={() => setLoaded(true)}
          />
        </a>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <code className="font-mono text-sm text-[#ff0040]">{image.imageId}</code>
          <span className="text-xs text-white/40">{formatFileSize(image.size)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={`/i/${image.imageId}`}
            className="flex items-center justify-center rounded-lg bg-white/5 px-3 py-2 text-white/80 transition-colors hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={onDelete}
            className="flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
