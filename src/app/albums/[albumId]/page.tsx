"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  Database,
  Search,
  Plus,
  ChevronRight,
  MoreVertical,
  Settings,
  Share2,
  Menu,
  X,
  Upload,
  Edit3,
  Trash2,
  Move,
  Check,
} from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { UploadModal, ImageCard, EmptyGallery } from "@/components/AniPicComponents";
import { 
  getAlbums, 
  getPublicImages, 
  formatFileSize, 
  type ImageMetadata, 
  type AlbumMetadata 
} from "@/lib/github";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

export default function AlbumDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const albumId = params.albumId as string;
  
  const [album, setAlbum] = useState<AlbumMetadata | null>(null);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [allImages, setAllImages] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedImageForMove, setSelectedImageForMove] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [albums, setAlbums] = useState<AlbumMetadata[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const username = (session?.user as any)?.username || session?.user?.name;
  const isOwner = album?.owner === username || album?.owner === 'anonymous';

  useEffect(() => {
    if (status !== 'loading') {
      loadAlbumData();
    }
  }, [albumId, session, status]);

  const loadAlbumData = async () => {
    setIsLoading(true);
    try {
      const [allAlbumsData, publicImages] = await Promise.all([
        getAlbums(),
        getPublicImages(),
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
      }
      
      setAlbums(allAlbumsData.filter(a => a.owner === username || a.owner === 'anonymous'));
      
      const currentAlbum = allAlbumsData.find(a => a.id === albumId);
      if (currentAlbum) {
        if (currentAlbum.owner !== 'anonymous' && currentAlbum.owner !== username && session) {
          setAlbum(null);
          setImages([]);
          setIsLoading(false);
          return;
        }
        
        setAlbum(currentAlbum);
        setNewAlbumName(currentAlbum.name);
        
        const allAvailableImages = [...publicImages, ...vaultImages];
        setAllImages(allAvailableImages);
        
        if (currentAlbum.images && currentAlbum.images.length > 0) {
          const albumImages = allAvailableImages.filter(img => 
            currentAlbum.images.includes(img.imageId)
          );
          setImages(albumImages);
          
          if (albumImages.length > 0 && !currentAlbum.coverImage) {
            currentAlbum.coverImage = albumImages[0].rawUrl;
          }
        } else {
          setImages([]);
        }
      } else {
        setAlbum(null);
      }
    } catch (error) {
      console.error('Failed to load album:', error);
    }
    setIsLoading(false);
  };

  const handleRename = async () => {
    if (!newAlbumName.trim() || !album) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/v1/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAlbumName.trim() })
      });
      if (res.ok) {
        setAlbum({ ...album, name: newAlbumName.trim() });
        setShowRenameModal(false);
      }
    } catch (e) {}
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (!album) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/albums/${albumId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/gallery');
      }
    } catch (e) {}
    setDeleting(false);
  };

  const handleMoveImage = async (targetAlbumId: string) => {
    if (!selectedImageForMove || !album) return;
    try {
      await fetch(`/api/v1/albums/${album.id}/images/${selectedImageForMove}`, {
        method: 'DELETE'
      });
      
      if (targetAlbumId !== 'none') {
        await fetch(`/api/v1/albums/${targetAlbumId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: selectedImageForMove })
        });
      }
      
      setShowMoveModal(false);
      setSelectedImageForMove(null);
      loadAlbumData();
    } catch (e) {}
  };

  const filteredImages = images.filter(img => 
    img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.imageId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const coverImage = album?.coverImage || (images.length > 0 ? images[0].rawUrl : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030304]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-accent-color" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030304] text-white px-4">
        <h2 className="text-2xl sm:text-3xl font-display uppercase mb-4 text-center">Album Not Found</h2>
        <p className="text-white/40 mb-6 text-center">This album doesn't exist or you don't have access to it.</p>
        <button onClick={() => router.push('/gallery')} className="btn-primary px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold text-sm">Back to Gallery</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030304] text-white selection:bg-accent-color/30">
      <header className="fixed left-0 right-0 top-0 z-[60] header-blur border-b border-white/5">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button onClick={() => router.back()} className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg sm:rounded-xl transition-colors text-white/40 hover:text-white shrink-0">
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="h-4 sm:h-6 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 min-w-0">
              <span className="hidden sm:inline">Gallery</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-white truncate max-w-[120px] sm:max-w-none">{album.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isOwner && (
              <div className="relative">
                <button 
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="glass-button p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-white/40 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <AnimatePresence>
                  {showOptionsMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-xl border border-white/10 overflow-hidden z-50"
                    >
                      <button 
                        onClick={() => { setShowRenameModal(true); setShowOptionsMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <Edit3 className="h-4 w-4 text-white/40" />
                        <span className="text-sm font-medium">Rename Album</span>
                      </button>
                      <button 
                        onClick={() => { setShowDeleteModal(true); setShowOptionsMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Delete Album</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button className="glass-button p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-white/40 hover:text-white hidden sm:flex">
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            {isOwner && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-accent-color/20"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Add</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-32">
        <div className="relative rounded-2xl sm:rounded-[3rem] overflow-hidden mb-8 sm:mb-16 border border-white/5 bg-white/[0.02]">
          <div className="absolute inset-0 z-0">
            <img src={coverImage} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="" />
          </div>
          
          <div className="relative z-10 p-4 sm:p-8 md:p-16 flex flex-col md:flex-row gap-6 sm:gap-12 items-center md:items-end">
            <div className="h-40 w-40 sm:h-64 sm:w-64 md:h-80 md:w-80 rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shrink-0">
              <img src={coverImage} className="w-full h-full object-cover" alt="" />
            </div>
            
            <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-left w-full">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-display uppercase leading-[0.85] tracking-tight">{album.name}</h1>
                <p className="text-sm sm:text-lg text-white/40 font-medium max-w-xl">{album.description || "No description provided."}</p>
                <p className="text-xs text-white/30">Owned by @{album.owner}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-color" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-display font-bold leading-none">{images.length}</p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">Assets</p>
                  </div>
                </div>
                
                <div className="h-6 sm:h-8 w-px bg-white/10" />
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center">
                    <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-display font-bold leading-none">{formatFileSize(album.totalSize)}</p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest">Size</p>
                  </div>
                </div>
                
                <div className="h-6 sm:h-8 w-px bg-white/10 hidden sm:block" />
                
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-display font-bold leading-none">{new Date(album.createdAt).getFullYear()}</p>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Created</p>
                  </div>
                </div>
              </div>

              {album.tags.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {album.tags.map(tag => (
                    <span key={tag} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-accent-color/10 border border-accent-color/20 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-accent-color">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-12">
          <div className="relative w-full">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/20" />
            <input
              type="text"
              placeholder="Search images in album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm font-medium focus:border-accent-color/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredImages.map((image) => (
              <div key={image.imageId} className="relative group">
                <ImageCard image={image} />
                {isOwner && (
                  <button
                    onClick={() => { setSelectedImageForMove(image.imageId); setShowMoveModal(true); }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <Move className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyGallery />
        )}
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={loadAlbumData}
        defaultAlbumId={albumId}
      />

      <AnimatePresence>
        {showRenameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRenameModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-strong rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-accent-color" />
                Rename Album
              </h3>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-color/50 transition-colors mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRenameModal(false)} className="flex-1 glass-button py-3 rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={handleRename} disabled={renaming || !newAlbumName.trim()} className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {renaming ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-strong rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete Album
              </h3>
              <p className="text-white/60 text-sm mb-6">Are you sure you want to delete "{album.name}"? The images will not be deleted but will be removed from this album.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 glass-button py-3 rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMoveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowMoveModal(false); setSelectedImageForMove(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-strong rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Move className="h-5 w-5 text-accent-color" />
                Move to Album
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleMoveImage('none')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <X className="h-5 w-5 text-white/40" />
                  </div>
                  <span className="font-medium">Remove from album</span>
                </button>
                {albums.filter(a => a.id !== albumId).map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleMoveImage(a.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
                  >
                    {a.coverImage ? (
                      <img src={a.coverImage} className="h-10 w-10 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-accent-color/10 flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-accent-color" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-white/40">{a.imageCount} images</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowMoveModal(false); setSelectedImageForMove(null); }} className="w-full glass-button py-3 rounded-xl text-sm font-bold mt-4">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
