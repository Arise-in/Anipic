"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Search,
  LayoutGrid,
  Grid3X3,
  Layers,
  HardDrive,
  Database,
  Filter,
  ArrowUpDown,
  Plus,
  ArrowLeft,
  ImageIcon,
  FolderOpen,
  ChevronRight,
  TrendingUp,
  X,
  Menu,
  Github,
  Upload,
  FolderPlus,
  Lock,
  Globe,
} from "lucide-react";
import { useSettings, type LayoutMode } from "@/lib/settings-context";
import { UploadModal, ImageCard, AlbumCard, EmptyGallery } from "@/components/AniPicComponents";
import { 
  getPublicImages, 
  getUserImages,
  getAlbums, 
  getUserAlbums,
  getStorageStats, 
  formatFileSize, 
  type ImageMetadata, 
  type AlbumMetadata, 
  type StorageStats 
} from "@/lib/github";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

function StorageOverview({ stats }: { stats: StorageStats | null }) {
  if (!stats) return null;

  return (
    <div className="glass-strong rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 mb-6 sm:mb-12 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <HardDrive className="h-16 w-16 sm:h-32 sm:w-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-display uppercase tracking-tight mb-1 sm:mb-2">Network <span className="text-accent-color">Storage</span></h2>
            <p className="text-white/40 text-xs sm:text-sm font-medium">Monitoring {stats.repos.length} active repositories.</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-lg sm:text-2xl font-display font-bold">{formatFileSize(stats.totalUsed)}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">Used Space</p>
            </div>
            <div className="h-8 sm:h-10 w-px bg-white/10" />
            <div className="text-left sm:text-right">
              <p className="text-lg sm:text-2xl font-display font-bold text-accent-color">{stats.imageCount}</p>
              <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">Assets</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {stats.repos.slice(0, 3).map((repo, i) => {
            const usage = (repo.size / (800 * 1024 * 1024)) * 100;
            return (
              <div key={repo.name} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-color" />
                    <span className="text-[10px] sm:text-xs font-bold truncate max-w-[100px] sm:max-w-none">{repo.name}</span>
                  </div>
                  <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${usage > 90 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {usage > 90 ? 'FULL' : 'ACTIVE'}
                  </span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usage, 100)}%` }}
                    className={`h-full ${usage > 90 ? 'bg-red-500' : usage > 70 ? 'bg-orange-500' : 'bg-accent-color'} rounded-full`} 
                  />
                </div>
                <div className="flex justify-between text-[8px] sm:text-[10px] font-bold text-white/30 uppercase">
                  <span>{formatFileSize(repo.size)}</span>
                  <span>{Math.round(usage)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreateAlbumModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        setName("");
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create album:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10"
      >
        <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
          <FolderPlus className="h-5 w-5 text-accent-color" />
          Create New Album
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter album name..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-color/50 transition-colors mb-4"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 glass-button py-3 rounded-xl text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
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
    </div>
  );
}

function GalleryContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [albums, setAlbums] = useState<AlbumMetadata[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"albums" | "images">("albums");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size">("newest");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const username = (session?.user as any)?.username || session?.user?.name;

  useEffect(() => {
    if (status !== 'loading') {
      loadData();
    }
    const mode = searchParams.get("view");
    if (mode === "images") setViewMode("images");
  }, [searchParams, session, status]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const [publicImages, allAlbums, stats] = await Promise.all([
        getPublicImages(),
        getAlbums(),
        getStorageStats(),
      ]);
      
      let vaultImages: ImageMetadata[] = [];
      if (session && username) {
        try {
          const vaultRes = await fetch('/api/v1/user/vault');
          if (vaultRes.ok) {
            const vaultData = await vaultRes.json();
            vaultImages = vaultData.data?.images || [];
          }
        } catch (e) {
          console.error('Failed to fetch vault:', e);
        }
        
        const userPublicImages = publicImages.filter(img => img.uploader === username);
        setImages([...vaultImages, ...userPublicImages]);
        
        const userAlbums = allAlbums.filter(album => album.owner === username);
        setAlbums(userAlbums);
      } else {
        setImages(publicImages);
        setAlbums(allAlbums.filter(album => album.owner === 'anonymous'));
      }
      
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    
    setIsLoading(false);
  };

  const filteredImages = images.filter(img => {
    const matchesSearch = img.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         img.imageId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRepo = selectedRepo === "all" || img.repository === selectedRepo;
    return matchesSearch && matchesRepo;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    if (sortBy === "oldest") return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    if (sortBy === "size") return b.size - a.size;
    return 0;
  });

  const filteredAlbums = albums.filter(album => 
    album.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030304] text-white selection:bg-accent-color/30">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-[60] header-blur border-b border-white/5">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <a href="/">
              <Logo size="md" />
            </a>
            
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setViewMode("albums")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${viewMode === "albums" ? "text-accent-color bg-accent-color/10" : "text-white/40 hover:text-white"}`}
              >
                Albums
              </button>
              <button 
                onClick={() => setViewMode("images")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${viewMode === "images" ? "text-accent-color bg-accent-color/10" : "text-white/40 hover:text-white"}`}
              >
                All Images
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-accent-color/20"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Upload</span>
            </button>
            
            {session ? (
              <a href="/settings" className="hidden sm:flex items-center gap-2 glass-button px-3 py-2 rounded-xl">
                <img src={session.user?.image || ""} className="h-6 w-6 rounded-full" alt="" />
              </a>
            ) : (
              <button onClick={() => signIn("github")} className="hidden sm:flex items-center gap-2 glass-button px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl"
            >
              <nav className="flex flex-col p-4 gap-2">
                <button 
                  onClick={() => { setViewMode("albums"); setMobileMenuOpen(false); }}
                  className={`px-4 py-3 rounded-xl text-left font-medium transition-colors ${viewMode === "albums" ? "bg-accent-color/10 text-accent-color" : "hover:bg-white/5"}`}
                >
                  Albums
                </button>
                <button 
                  onClick={() => { setViewMode("images"); setMobileMenuOpen(false); }}
                  className={`px-4 py-3 rounded-xl text-left font-medium transition-colors ${viewMode === "images" ? "bg-accent-color/10 text-accent-color" : "hover:bg-white/5"}`}
                >
                  All Images
                </button>
                <a href="/" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium">Home</a>
                <a href="/settings" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium">Settings</a>
                {!session && (
                  <button onClick={() => signIn("github")} className="mt-2 flex items-center justify-center gap-2 btn-primary px-4 py-3 rounded-xl font-bold">
                    <Github className="h-4 w-4" />
                    Sign in with GitHub
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-32">
        {/* Page Header */}
        <div className="mb-6 sm:mb-12">
          <div className="flex items-center gap-2 text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-4">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Gallery</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-display uppercase leading-none mb-2">
                {session ? 'My' : 'Public'} <span className="text-accent-color">Vault</span>
              </h1>
              {session && (
                <p className="text-white/40 text-xs sm:text-sm flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Showing only your uploads
                </p>
              )}
              {!session && (
                <p className="text-white/40 text-xs sm:text-sm flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  Sign in to see your personal gallery
                </p>
              )}
            </div>
          </div>
        </div>

        <StorageOverview stats={storageStats} />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-12">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/20" />
            <input
              type="text"
              placeholder={`Search ${viewMode === 'albums' ? 'albums' : 'images'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm font-medium focus:border-accent-color/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 pr-8 sm:pr-12 text-[10px] sm:text-xs font-bold uppercase tracking-widest appearance-none focus:outline-none focus:border-accent-color/50 transition-colors"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="size">Size</option>
              </select>
              <ArrowUpDown className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-white/20 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 ml-auto">
              <button 
                onClick={() => setViewMode("albums")}
                className={`p-2 sm:p-2.5 rounded-lg transition-all ${viewMode === "albums" ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" : "text-white/40 hover:text-white"}`}
              >
                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button 
                onClick={() => setViewMode("images")}
                className={`p-2 sm:p-2.5 rounded-lg transition-all ${viewMode === "images" ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" : "text-white/40 hover:text-white"}`}
              >
                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl sm:rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "albums" ? (
              <motion.div
                key="albums"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
              >
                {/* Create Album Button */}
                <button 
                  onClick={() => setIsCreateAlbumOpen(true)}
                  className="group relative rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-white/10 p-4 sm:p-8 flex flex-col items-center justify-center gap-3 sm:gap-6 hover:border-accent-color/50 hover:bg-accent-color/5 transition-all duration-500 aspect-[4/5]"
                >
                  <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent-color/10 transition-all duration-500">
                    <Plus className="h-6 w-6 sm:h-10 sm:w-10 text-white/20 group-hover:text-accent-color" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm sm:text-xl font-bold uppercase tracking-tight">New Album</p>
                    <p className="text-[10px] sm:text-xs text-white/30 font-bold mt-1 uppercase tracking-widest hidden sm:block">Organize assets</p>
                  </div>
                </button>
                
                {filteredAlbums.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-20 text-center">
                    <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 text-white/10 mb-4" />
                    <p className="text-white/40 text-sm sm:text-base">No albums yet. Create your first one!</p>
                  </div>
                )}
                
                {filteredAlbums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {filteredImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {filteredImages.map((image) => (
                      <ImageCard key={image.imageId} image={image} />
                    ))}
                  </div>
                ) : (
                  <EmptyGallery />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={loadData}
      />
      
      <CreateAlbumModal
        isOpen={isCreateAlbumOpen}
        onClose={() => setIsCreateAlbumOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#030304]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-accent-color" />
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
