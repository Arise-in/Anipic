"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  ExternalLink,
  Download,
  Globe,
  Link2,
  Calendar,
  HardDrive,
  FileType,
  ChevronDown,
  Database,
  Activity,
  Zap,
  ArrowRight,
  FolderPlus,
  Settings2,
  AlertCircle,
  Lock,
  Plus,
  QrCode,
  Palette,
  Type,
  Square,
  Circle,
} from "lucide-react";
import { type ImageMetadata, type AlbumMetadata, type StorageStats, getAlbums, getStorageStats, formatFileSize } from "@/lib/github";
import { useSettings } from "@/lib/settings-context";
import { motion, AnimatePresence } from "framer-motion";

interface UploadResponse {
  success: boolean;
  error?: string;
  data?: {
    imageId: string;
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    uploader: string;
    links: {
      view: string;
      embed: string;
      raw: string;
      direct: string;
    };
  };
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (metadata: ImageMetadata) => void;
  defaultAlbumId?: string;
}

export function UploadModal({ isOpen, onClose, onUploadComplete, defaultAlbumId }: UploadModalProps) {
  const { data: session } = useSession();
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [albums, setAlbums] = useState<AlbumMetadata[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>(defaultAlbumId || "default");
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>("0 MB/s");
  const [processingStep, setProcessingStep] = useState<string>("");
  const [driveType, setDriveType] = useState<"public" | "private">(session ? "private" : "public");
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrLinkType, setQrLinkType] = useState<"view" | "embed" | "raw">("view");
  const qrRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState({
    generateThumbnail: true,
    compress: false,
  });

  const { settings } = useSettings();

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (session) {
        setDriveType("private");
      }
      if (defaultAlbumId) {
        setSelectedAlbum(defaultAlbumId);
      }
    }
  }, [isOpen, session, defaultAlbumId]);

  useEffect(() => {
    if (isOpen) {
      loadAlbumsForDriveType();
    }
  }, [driveType, isOpen]);

  const loadInitialData = async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
    await loadAlbumsForDriveType();
  };

  const loadAlbumsForDriveType = async () => {
    if (driveType === 'private' && session) {
      try {
        const vaultRes = await fetch('/api/v1/user/vault');
        if (vaultRes.ok) {
          const vaultData = await vaultRes.json();
          if (vaultData.data?.exists) {
            const albumsRes = await fetch(`/api/v1/albums?userOnly=true`);
            if (albumsRes.ok) {
              const albumsData = await albumsRes.json();
              const userAlbums = (albumsData.data || []).filter((a: any) => 
                a.owner === (session.user as any)?.username || a.isPrivate
              );
              setAlbums(userAlbums);
            }
          } else {
            setAlbums([]);
          }
        }
      } catch (e) {
        console.error('Failed to load private albums:', e);
        setAlbums([]);
      }
    } else {
      const albumList = await getAlbums();
      setAlbums(albumList.filter(a => a.owner === 'anonymous' || !a.owner));
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;
    
    setCreatingAlbum(true);
    try {
      const res = await fetch('/api/v1/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newAlbumName.trim(),
          isPrivate: driveType === 'private'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAlbums(prev => [...prev, data.album]);
        setSelectedAlbum(data.album.id);
        setShowNewAlbumModal(false);
        setNewAlbumName("");
      } else {
        const errorData = await res.json();
        console.error('Failed to create album:', errorData.error);
      }
    } catch (err) {
      console.error('Failed to create album:', err);
    } finally {
      setCreatingAlbum(false);
    }
  };

  const validateFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const maxSize = 25 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) return { valid: false, reason: "Unsupported format" };
    if (file.size > maxSize) return { valid: false, reason: "File too large (Max 25MB)" };
    return { valid: true };
  };

  const handleUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.reason || "Invalid file");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setProgress(0);
    setError(null);
    setProcessingStep("Validating file...");
    
    const startTime = Date.now();
    
    try {
      setProcessingStep(`Album selected: ${albums.find(a => a.id === selectedAlbum)?.name || 'Default'}`);
      await new Promise(r => setTimeout(r, 800));
      
        setProcessingStep(`Uploading to ${driveType === 'private' ? 'Private Vault' : 'Public Drive'}...`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('albumId', selectedAlbum);
        formData.append('driveType', driveType);
        formData.append('compress', options.compress.toString());
        formData.append('thumbnail', options.generateThumbnail.toString());
        formData.append('uploader', session?.user?.name || 'anonymous');

        const progressInterval = setInterval(() => {
          setProgress(p => Math.min(p + 10, 80));
        }, 500);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        clearInterval(progressInterval);

      const result: UploadResponse = await response.json();

        if (!result.success || !result.data) {
          const errorMessage = result.error || 'Upload failed';
          if (errorMessage.includes('Permission denied') || errorMessage.includes('sign out')) {
            throw new Error('Permission denied. Please sign out and sign in again to grant repository access.');
          }
          throw new Error(errorMessage);
        }

      setProcessingStep("Generating thumbnail...");
      setProgress(90);
      await new Promise(r => setTimeout(r, 600));

      setProcessingStep("Creating shareable link...");
      setProgress(100);
      
      setUploadResult(result.data);
      setUploadState("success");

      const metadata: ImageMetadata = {
        imageId: result.data.imageId,
        filename: result.data.filename,
        uploadedAt: result.data.uploadedAt,
        uploader: result.data.uploader,
        size: result.data.size,
        mimeType: result.data.mimeType,
        repository: storageStats?.repos[0]?.name || 'anipic-1',
        rawUrl: result.data.links.raw,
      };
      onUploadComplete?.(metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const resetModal = () => {
    setUploadState("idle");
    setProgress(0);
    setUploadResult(null);
    setError(null);
    setSelectedFile(null);
    setPreview(null);
  };

  if (!isOpen) return null;

  const currentRepo = storageStats?.repos[0];
  const usagePercent = currentRepo ? (currentRepo.size / (800 * 1024 * 1024)) * 100 : 0;
  const usageColor = usagePercent > 90 ? "bg-red-500" : usagePercent > 75 ? "bg-orange-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-strong relative w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[32px] shadow-2xl border border-white/10 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex items-center justify-between bg-[rgba(16,16,20,0.98)] backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color shrink-0">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold font-heading truncate">Upload Assets</h2>
              <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">New Publication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg sm:rounded-xl transition-colors text-white/40 hover:text-white shrink-0">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

          <div className="p-4 sm:p-6 md:p-8">
            <AnimatePresence mode="wait">
              {uploadState === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4 sm:space-y-6 md:space-y-8">
                      {/* Drive Type Selector */}
                      <div className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/5">
                        <button
                          onClick={() => setDriveType("public")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            driveType === "public" 
                              ? "bg-accent-color text-white shadow-lg" 
                              : "text-white/40 hover:text-white"
                          }`}
                        >
                          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Public Drive
                        </button>
                        <button
                          onClick={() => session && setDriveType("private")}
                          disabled={!session}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            driveType === "private" 
                              ? "bg-violet-500 text-white shadow-lg" 
                              : !session 
                                ? "text-white/20 cursor-not-allowed" 
                                : "text-white/40 hover:text-white"
                          }`}
                        >
                          <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Private Vault
                          {!session && <span className="text-[8px] sm:text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full ml-1">Login Required</span>}
                        </button>
                      </div>

                      {driveType === "private" && session && (
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-start gap-3">
                          <Lock className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-violet-300">Private Vault Mode</p>
                            <p className="text-[10px] sm:text-xs text-violet-300/60 mt-0.5">Images will be stored in a private GitHub repository. Only you can access the direct links.</p>
                          </div>
                        </div>
                      )}

                    {/* Target Repo Info */}
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-color shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-white/80">{currentRepo?.name || 'anipic-public-1'}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-accent-color/70 italic">Will auto-create anipic-{storageStats?.repos.length ? storageStats.repos.length + 1 : 2} if needed</span>
                      </div>
                      <div className="h-1.5 sm:h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                          className={`h-full ${usageColor} rounded-full`} 
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 sm:mt-2">
                        <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-bold tracking-tighter">{formatFileSize(currentRepo?.size || 0)} / 800MB</span>
                        <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-bold tracking-tighter">{Math.round(usagePercent)}% FULL</span>
                      </div>
                    </div>

                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`relative group cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed p-6 sm:p-8 md:p-12 text-center transition-all duration-500 ${
                      isDragActive ? "border-accent-color bg-accent-color/5 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {preview ? (
                      <div className="relative aspect-video max-h-40 sm:max-h-52 md:max-h-64 mx-auto rounded-xl sm:rounded-2xl overflow-hidden group">
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-xs sm:text-sm font-bold">Click to change file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-2xl sm:rounded-3xl bg-accent-color/5 border border-accent-color/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                          <ImageIcon className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-accent-color" />
                        </div>
                        <div>
                          <p className="text-base sm:text-lg md:text-xl font-bold">Drag & drop your image here</p>
                          <p className="text-white/40 mt-1 text-xs sm:text-sm">Supports JPG, PNG, GIF, WebP, SVG (Max 25MB)</p>
                        </div>
                      </div>
                    )}
                    {selectedFile && (
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest animate-fade-in">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Valid File
                      </div>
                    )}
                  </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2 sm:space-y-4">
                        <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 sm:gap-2">
                          <FolderPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Select Album
                        </label>
                        <div className="relative group">
                          <select 
                            value={selectedAlbum}
                            onChange={(e) => setSelectedAlbum(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium appearance-none focus:outline-none focus:border-accent-color/50 transition-colors"
                          >
                            <option value="default">Default Album</option>
                            {albums.map(album => (
                              <option key={album.id} value={album.id}>{album.name} ({album.imageCount} imgs)</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/20 pointer-events-none group-hover:text-white/40 transition-colors" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewAlbumModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          Create New Album
                        </button>
                      </div>

                      <div className="space-y-2 sm:space-y-4">
                        <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 sm:gap-2">
                          <Settings2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Advanced Options
                        </label>
                        <div className="space-y-2 sm:space-y-3">
                          <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-xs sm:text-sm font-medium">Generate Thumbnails</span>
                            <input 
                              type="checkbox" 
                              checked={options.generateThumbnail} 
                              onChange={(e) => setOptions(o => ({ ...o, generateThumbnail: e.target.checked }))}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-accent-color"
                            />
                          </label>
                          <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-xs sm:text-sm font-medium">Auto-Compression</span>
                            <input 
                              type="checkbox" 
                              checked={options.compress} 
                              onChange={(e) => setOptions(o => ({ ...o, compress: e.target.checked }))}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-accent-color"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                  <button
                    disabled={!selectedFile}
                    onClick={() => handleUpload(selectedFile!)}
                    className="w-full btn-primary py-3.5 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed group text-sm sm:text-base"
                  >
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                    Start Professional Upload
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
            )}

            {uploadState === "uploading" && (
              <motion.div key="uploading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 sm:py-16 md:py-20 text-center space-y-6 sm:space-y-8 md:space-y-10">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 mx-auto">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" 
                      className="text-accent-color"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-display font-bold">{Math.round(progress)}%</span>
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-4 sm:space-y-6 px-2">
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-heading">Processing Asset</h3>
                    <p className="text-white/40 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2">
                      <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse text-accent-color" /> {processingStep}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/20 mb-0.5 sm:mb-1">Upload Speed</p>
                      <p className="text-base sm:text-lg font-bold font-display tracking-wide">{uploadSpeed}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/20 mb-0.5 sm:mb-1">Time Remaining</p>
                      <p className="text-base sm:text-lg font-bold font-display tracking-wide">~2s</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

              {uploadState === "success" && uploadResult && (
                <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6 md:space-y-8">
                  <div className="text-center space-y-2 sm:space-y-4">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce shadow-2xl shadow-emerald-500/20">
                      <Check className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-display uppercase tracking-tight">Upload Successful!</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
                    <div className="aspect-square max-h-48 sm:max-h-64 md:max-h-full rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 group relative shadow-2xl mx-auto w-full">
                      <img src={uploadResult.links.raw} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    <div className="space-y-3 sm:space-y-4 md:space-y-5">
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest">Shareable View Link</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 group">
                          <code className="flex-1 truncate text-[10px] sm:text-xs text-white/60 font-mono">{uploadResult.links.view}</code>
                          <button onClick={() => { navigator.clipboard.writeText(uploadResult.links.view); setCopied('view'); setTimeout(() => setCopied(null), 2000); }} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                            {copied === 'view' ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/20 uppercase tracking-widest">Direct CDN Link</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 group">
                          <code className="flex-1 truncate text-[10px] sm:text-xs text-accent-color font-mono">{uploadResult.links.raw}</code>
                          <button onClick={() => { navigator.clipboard.writeText(uploadResult.links.raw); setCopied('raw'); setTimeout(() => setCopied(null), 2000); }} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                            {copied === 'raw' ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </button>
                        </div>
                      </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-4">
                          <a href={uploadResult.links.view} className="glass-button py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2">
                            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> View
                          </a>
                          <button onClick={() => setShowQrCode(true)} className="glass-button py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-accent-color/30 hover:bg-accent-color/10">
                            <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> QR Code
                          </button>
                          <button onClick={resetModal} className="btn-primary py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2">
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> More
                          </button>
                        </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <AnimatePresence>
                    {showQrCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-accent-color" />
                              QR Code Generator
                            </h3>
                            <button onClick={() => setShowQrCode(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                              <X className="h-4 w-4 text-white/40" />
                            </button>
                          </div>
                          
                          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                            {(['view', 'embed', 'raw'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setQrLinkType(type)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                  qrLinkType === type ? 'bg-accent-color text-white' : 'text-white/40 hover:text-white'
                                }`}
                              >
                                {type === 'view' ? 'View Page' : type === 'embed' ? 'Embed Link' : 'Direct CDN'}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-xl">
                              <QRCodeSVG
                                value={qrLinkType === 'view' ? uploadResult.links.view : qrLinkType === 'embed' ? uploadResult.links.embed : uploadResult.links.raw}
                                size={160}
                                level="H"
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                marginSize={2}
                                imageSettings={{
                                  src: "/anipic-logo.svg",
                                  height: 32,
                                  width: 32,
                                  excavate: true,
                                }}
                              />
                            </div>
                            <div className="flex-1 space-y-3 text-center sm:text-left">
                              <div>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">QR Links To</p>
                                <code className="text-[10px] sm:text-xs text-accent-color break-all">
                                  {qrLinkType === 'view' ? uploadResult.links.view : qrLinkType === 'embed' ? uploadResult.links.embed : uploadResult.links.raw}
                                </code>
                              </div>
                              <div className="flex gap-2 justify-center sm:justify-start">
                                <button
                                  onClick={() => {
                                    const canvas = qrRef.current?.querySelector('canvas') || document.createElement('canvas');
                                    const svg = qrRef.current?.querySelector('svg');
                                    if (svg) {
                                      const svgData = new XMLSerializer().serializeToString(svg);
                                      const c = document.createElement('canvas');
                                      c.width = 200; c.height = 200;
                                      const ctx = c.getContext('2d');
                                      const img = new window.Image();
                                      img.onload = () => {
                                        ctx?.drawImage(img, 0, 0);
                                        const a = document.createElement('a');
                                        a.download = `anipic-qr-${uploadResult.imageId}.png`;
                                        a.href = c.toDataURL('image/png');
                                        a.click();
                                      };
                                      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                    }
                                  }}
                                  className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download PNG
                                </button>
                                <a href="/settings#qr" className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                  <Settings2 className="h-3.5 w-3.5" /> Customize
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

            {uploadState === "error" && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 sm:py-16 md:py-20 text-center space-y-4 sm:space-y-6">
                <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-2xl sm:rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-heading">Something went wrong</h3>
                  <p className="text-white/40 max-w-xs mx-auto text-xs sm:text-sm px-4">{error}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={resetModal} className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm">
                    Try Again
                  </button>
                  {error?.includes('Permission') && (
                    <button 
                      onClick={() => {
                        import('next-auth/react').then(({ signOut }) => signOut());
                      }} 
                      className="glass-button px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm"
                    >
                      Sign Out & Re-login
                    </button>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* New Album Modal */}
        <AnimatePresence>
          {showNewAlbumModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/80" onClick={() => setShowNewAlbumModal(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md glass-strong rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10"
              >
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-accent-color" />
                  Create New Album
                </h3>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Enter album name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-color/50 transition-colors mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createAlbum()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewAlbumModal(false)}
                    className="flex-1 glass-button py-3 rounded-xl text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createAlbum}
                    disabled={!newAlbumName.trim() || creatingAlbum}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingAlbum ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

interface ImageCardProps {
  image: ImageMetadata;
  onCopy?: (url: string) => void;
}

export function ImageCard({ image, onCopy }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getEmbedLink, settings } = useSettings();

  const handleCopy = () => {
    const url = getEmbedLink(image.imageId, image.rawUrl);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(url);
  };

  return (
    <div className="group">
      <div className="glass-card overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:border-accent-color/30 shadow-xl hover:shadow-accent-color/5">
        <div className="relative aspect-square sm:aspect-auto">
          <a href={`/i/${image.imageId}`} className="block overflow-hidden">
            <img
              src={image.rawUrl}
              alt={image.filename}
              className={`w-full h-full object-cover transition-all duration-700 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-110 absolute"} group-hover:scale-110`}
              onLoad={() => setLoaded(true)}
            />
          </a>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
              {image.repository}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 btn-primary flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl py-2 sm:py-3 text-[10px] sm:text-xs font-bold"
              >
                {copied ? <><Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Copied</> : <><Link2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Copy</>}
              </button>
              <a href={`/i/${image.imageId}`} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-5 border-t border-white/5 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-xs sm:text-sm font-bold truncate">{image.filename}</p>
            <p className="text-[8px] sm:text-[10px] text-white/30 uppercase font-bold tracking-widest mt-0.5">{formatFileSize(image.size)}</p>
          </div>
          <code className="font-mono text-[8px] sm:text-[10px] font-bold text-accent-color bg-accent-color/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shrink-0">{image.imageId}</code>
        </div>
      </div>
    </div>
  );
}

export function AlbumCard({ album }: { album: AlbumMetadata }) {
  const coverImage = album.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400';
  
  return (
    <a href={`/albums/${album.id}`} className="group relative glass-card rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/5] transition-all duration-500 hover:scale-[1.02] hover:border-accent-color/30 hover:shadow-2xl shadow-accent-color/10 block">
      <div className="absolute inset-0 z-0">
        <img src={coverImage} className="w-full h-full object-cover blur-2xl opacity-40 scale-125" alt="" />
      </div>

      <div className="relative z-10 h-full flex flex-col p-3 sm:p-6">
        <div className="flex-1 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-[1.05] transition-transform duration-700">
          <img 
            src={coverImage} 
            className="w-full h-full object-cover"
            alt={album.name}
          />
        </div>

        <div className="mt-3 sm:mt-6 space-y-1.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-xl font-bold font-heading leading-none truncate group-hover:text-accent-color transition-colors">{album.name}</h3>
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-white/5 text-[8px] sm:text-[10px] font-bold text-white/40 uppercase shrink-0">{album.images?.length || album.imageCount || 0}</span>
          </div>
          
          <div className="h-0.5 w-8 sm:w-12 bg-accent-color rounded-full" />
          
          <div className="flex items-center justify-between text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">
            <span>{formatFileSize(album.totalSize)}</span>
            <span className="hidden sm:inline">{new Date(album.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-32 text-center px-4">
      <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl sm:rounded-[32px] bg-accent-color/5 border border-accent-color/10 flex items-center justify-center mb-4 sm:mb-8 animate-float">
        <ImageIcon className="h-7 w-7 sm:h-10 sm:w-10 text-accent-color/40" />
      </div>
      <h3 className="text-lg sm:text-2xl font-bold font-heading mb-2">No images yet</h3>
      <p className="text-white/40 max-w-xs mx-auto text-sm">Upload your first image to start your collection.</p>
    </div>
  );
}
