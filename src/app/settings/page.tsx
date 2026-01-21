"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import {
  User,
  HardDrive,
  Upload,
  Code2,
  Palette,
  Shield,
  Bell,
  Trash2,
  Github,
  Check,
  Copy,
  ChevronRight,
  Database,
  Monitor,
  Eye,
  Settings,
  Mail,
  Lock,
  Zap,
  Layout,
  LayoutGrid,
  Maximize,
  AlertTriangle,
  LogOut,
  RefreshCw,
  ExternalLink,
  FolderPlus,
  Image as ImageIcon,
  Plus,
  X,
  QrCode,
  Download,
  Link2,
  Square,
  Circle,
} from "lucide-react";
import { useSettings, accentColors, AccentColor } from "@/lib/settings-context";
import { getStorageStats, formatFileSize, getAlbums, type StorageStats, type AlbumMetadata } from "@/lib/github";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

function Header() {
  const { data: session } = useSession();
  return (
    <header className="fixed left-0 right-0 top-0 z-[60] header-blur border-b border-white/5">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/">
          <Logo size="md" />
        </a>

        <div className="flex items-center gap-4">
          <a href="/gallery" className="nav-link hidden sm:block">Gallery</a>
          <a href="/docs" className="nav-link hidden sm:block">Docs</a>
          {session && (
            <div className="flex items-center gap-2 glass-button px-3 py-2 rounded-xl">
              <img src={session.user?.image || ""} className="h-6 w-6 rounded-full" alt="" />
              <span className="text-sm font-medium hidden xs:block">{session.user?.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SectionHeader({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="h-12 w-12 rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-bold font-heading">{title}</h2>
        <p className="text-sm text-white/40">{desc}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean, onChange: (v: boolean) => void, label: string, desc: string }) {
  return (
    <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all">
      <div className="space-y-1">
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? "bg-accent-color" : "bg-white/10"}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { settings, updateSettings, accentHex } = useSettings();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [activeSection, setActiveSection] = useState("account");
  const [copied, setCopied] = useState(false);
  const [vaultData, setVaultData] = useState<{ exists: boolean; imageCount: number; size: number; images: any[] } | null>(null);
  const [albums, setAlbums] = useState<AlbumMetadata[]>([]);
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const qrPreviewRef = useRef<HTMLDivElement>(null);
  
  const [qrSettings, setQrSettings] = useState({
    defaultLinkType: "view" as "view" | "embed" | "raw",
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    size: 200,
    errorCorrectionLevel: "H" as "L" | "M" | "Q" | "H",
    showLogo: true,
    logoSize: 40,
    cornerRadius: 0,
    dotStyle: "square" as "square" | "dots",
    useAccentColor: false,
  });
  const [qrPreviewUrl, setQrPreviewUrl] = useState("https://anipic.app/i/demo123");

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#qr') {
      setActiveSection('qr');
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadAlbums();
  }, []);

  useEffect(() => {
    if (session) {
      loadVault();
    }
  }, [session]);

  const loadStats = async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
  };

  const loadAlbums = async () => {
    const albumList = await getAlbums();
    setAlbums(albumList);
  };

  const loadVault = async () => {
    try {
      const res = await fetch('/api/v1/user/vault');
      if (res.ok) {
        const data = await res.json();
        setVaultData(data.data);
      }
    } catch (e) {
      console.error('Failed to load vault:', e);
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const res = await fetch('/api/v1/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAlbumName.trim() })
      });
      if (res.ok) {
        await loadAlbums();
        setShowNewAlbumModal(false);
        setNewAlbumName("");
      }
    } catch (e) {
      console.error('Failed to create album:', e);
    } finally {
      setCreatingAlbum(false);
    }
  };

  const copyToken = () => {
    if (session?.user?.name) {
      navigator.clipboard.writeText(session.user.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sections = [
    { id: "account", icon: User, label: "Account" },
    { id: "vault", icon: Lock, label: "Private Vault" },
    { id: "albums", icon: FolderPlus, label: "Albums" },
    { id: "qr", icon: QrCode, label: "QR Code" },
    { id: "storage", icon: HardDrive, label: "Storage" },
    { id: "upload", icon: Upload, label: "Uploads" },
    { id: "api", icon: Code2, label: "API Access" },
    { id: "appearance", icon: Palette, label: "Appearance" },
    { id: "privacy", icon: Shield, label: "Privacy" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "danger", icon: AlertTriangle, label: "Danger Zone", color: "text-red-500" },
  ];

  return (
    <>
    <Header />
    <div className="min-h-screen bg-[#030304] text-white pt-24 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest mb-4">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white">Settings</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display uppercase mb-12">Control <span className="text-accent-color">Center</span></h1>

        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="space-y-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all group ${
                  activeSection === s.id 
                    ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <s.icon className={`h-5 w-5 ${activeSection === s.id ? "text-white" : (s.color || "text-white/20 group-hover:text-white/60")}`} />
                {s.label}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <div className="glass-strong rounded-[2.5rem] p-8 md:p-12 border border-white/5 min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeSection === "account" && (
                <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <SectionHeader icon={User} title="Account Settings" desc="Manage your personal information and account status." />
                  
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-accent-color to-orange-500 p-0.5 shadow-2xl">
                      <img src={session?.user?.image || ""} className="w-full h-full object-cover rounded-[1.4rem]" alt="" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{session?.user?.name}</h3>
                      <p className="text-white/40 text-sm">{session?.user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">GitHub Pro</span>
                        <span className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Member since 2026</span>
                      </div>
                    </div>
                    <button onClick={() => signOut()} className="glass-button p-4 rounded-2xl text-red-400">
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3 text-white/60">
                        <Github className="h-5 w-5" />
                        <span className="text-sm font-bold">Connected GitHub Account</span>
                      </div>
                      <p className="text-sm font-medium">{session?.user?.name}</p>
                      <button className="text-xs font-bold text-accent-color uppercase tracking-widest hover:underline">Change Account</button>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3 text-white/60">
                        <Mail className="h-5 w-5" />
                        <span className="text-sm font-bold">Primary Email</span>
                      </div>
                      <p className="text-sm font-medium">{session?.user?.email || "Not provided"}</p>
                      <button className="text-xs font-bold text-accent-color uppercase tracking-widest hover:underline">Update Email</button>
                    </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === "vault" && (
                  <motion.div key="vault" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <SectionHeader icon={Lock} title="Private Vault" desc="Your personal encrypted image storage that only you can access." />
                    
                    {!session ? (
                      <div className="p-12 rounded-3xl bg-violet-500/5 border border-violet-500/10 text-center space-y-6">
                        <Lock className="h-16 w-16 text-violet-400 mx-auto" />
                        <div>
                          <h3 className="text-2xl font-bold">Sign in Required</h3>
                          <p className="text-white/40 max-w-sm mx-auto text-sm mt-2">Connect your GitHub account to access your private vault.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-8 rounded-3xl bg-violet-500/5 border border-violet-500/10">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-1">Your Private Vault</p>
                              <p className="text-4xl font-display uppercase">
                                {vaultData?.exists ? formatFileSize(vaultData.size) : '0 B'}
                                <span className="text-white/20"> stored</span>
                              </p>
                            </div>
                            <RefreshCw className="h-6 w-6 text-white/20 hover:text-white cursor-pointer transition-colors" onClick={loadVault} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 text-center">
                              <p className="text-2xl font-bold">{vaultData?.imageCount || 0}</p>
                              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Images</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 text-center">
                              <p className="text-2xl font-bold">{vaultData?.exists ? 'Active' : 'Inactive'}</p>
                              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Status</p>
                            </div>
                          </div>
                        </div>

                        {vaultData?.images && vaultData.images.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest">Recent Vault Images</h4>
                            <div className="grid grid-cols-3 gap-4">
                              {vaultData.images.slice(0, 6).map((img: any) => (
                                <div key={img.imageId} className="aspect-square rounded-2xl bg-white/5 border border-white/5 overflow-hidden group relative">
                                  <img src={img.rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-xs font-bold">{img.imageId}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                          <Shield className="h-6 w-6 text-violet-400 shrink-0 mt-1" />
                          <div>
                            <h4 className="font-bold text-sm">End-to-End Privacy</h4>
                            <p className="text-xs text-white/40 mt-1">Your vault is stored in a private GitHub repository under your account. Only you have access to these images.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {activeSection === "albums" && (
                  <motion.div key="albums" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <SectionHeader icon={FolderPlus} title="Albums" desc="Organize your images into collections." />
                    
                    <button
                      onClick={() => setShowNewAlbumModal(true)}
                      className="w-full p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent-color/50 hover:bg-accent-color/5 transition-all flex items-center justify-center gap-3 group"
                    >
                      <Plus className="h-5 w-5 text-white/40 group-hover:text-accent-color transition-colors" />
                      <span className="font-bold text-white/40 group-hover:text-white transition-colors">Create New Album</span>
                    </button>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest">Your Albums ({albums.length})</h4>
                      <div className="grid gap-4">
                        {albums.length === 0 ? (
                          <div className="p-12 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <FolderPlus className="h-12 w-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/40 text-sm">No albums yet. Create one to organize your images!</p>
                          </div>
                        ) : albums.map(album => (
                          <div key={album.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                            <div className="flex items-center gap-4">
                              {album.coverImage ? (
                                <img src={album.coverImage} className="h-14 w-14 rounded-xl object-cover" alt="" />
                              ) : (
                                <div className="h-14 w-14 rounded-xl bg-accent-color/10 flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-accent-color" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold">{album.name}</p>
                                <p className="text-xs text-white/40">{album.imageCount} images • {formatFileSize(album.totalSize)}</p>
                              </div>
                            </div>
                            <a href={`/albums/${album.id}`} className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                              View <ChevronRight className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                    </motion.div>
                  )}

                {activeSection === "qr" && (
                  <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8" id="qr">
                    <SectionHeader icon={QrCode} title="QR Code Settings" desc="Customize how QR codes are generated for your images." />
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* QR Preview */}
                      <div className="order-2 lg:order-1 space-y-6">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                          <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-6">Live Preview</p>
                          <div 
                            ref={qrPreviewRef} 
                            className="p-6 shadow-2xl transition-all" 
                            style={{ 
                              backgroundColor: qrSettings.bgColor,
                              borderRadius: `${qrSettings.cornerRadius}px`,
                            }}
                          >
                            <QRCodeSVG
                              value={qrPreviewUrl}
                              size={qrSettings.size}
                              level={qrSettings.errorCorrectionLevel}
                              bgColor={qrSettings.bgColor}
                              fgColor={qrSettings.useAccentColor ? accentHex : qrSettings.fgColor}
                              marginSize={2}
                              imageSettings={qrSettings.showLogo ? {
                                src: "/anipic-logo.svg",
                                height: qrSettings.logoSize,
                                width: qrSettings.logoSize,
                                excavate: true,
                              } : undefined}
                            />
                          </div>
                          <div className="mt-6 flex gap-3">
                            <button
                              onClick={() => {
                                const svg = qrPreviewRef.current?.querySelector('svg');
                                if (svg) {
                                  const svgData = new XMLSerializer().serializeToString(svg);
                                  const c = document.createElement('canvas');
                                  const padding = qrSettings.cornerRadius > 0 ? 48 : 48;
                                  c.width = qrSettings.size + padding; c.height = qrSettings.size + padding;
                                  const ctx = c.getContext('2d');
                                  if (ctx) {
                                    ctx.fillStyle = qrSettings.bgColor;
                                    if (qrSettings.cornerRadius > 0) {
                                      ctx.beginPath();
                                      ctx.roundRect(0, 0, c.width, c.height, qrSettings.cornerRadius);
                                      ctx.fill();
                                    } else {
                                      ctx.fillRect(0, 0, c.width, c.height);
                                    }
                                  }
                                  const img = new window.Image();
                                  img.onload = () => {
                                    ctx?.drawImage(img, 24, 24);
                                    const a = document.createElement('a');
                                    a.download = `anipic-qr-preview.png`;
                                    a.href = c.toDataURL('image/png');
                                    a.click();
                                  };
                                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                                }
                              }}
                              className="glass-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                            >
                              <Download className="h-3.5 w-3.5" /> Download PNG
                            </button>
                            <button
                              onClick={() => {
                                const svg = qrPreviewRef.current?.querySelector('svg');
                                if (svg) {
                                  const svgData = new XMLSerializer().serializeToString(svg);
                                  const blob = new Blob([svgData], { type: 'image/svg+xml' });
                                  const a = document.createElement('a');
                                  a.download = `anipic-qr-preview.svg`;
                                  a.href = URL.createObjectURL(blob);
                                  a.click();
                                }
                              }}
                              className="glass-button px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                            >
                              <Download className="h-3.5 w-3.5" /> Download SVG
                            </button>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Preview URL</label>
                          <input
                            type="text"
                            value={qrPreviewUrl}
                            onChange={(e) => setQrPreviewUrl(e.target.value)}
                            className="w-full bg-transparent border-none text-sm font-mono focus:outline-none text-accent-color"
                            placeholder="https://anipic.app/i/demo123"
                          />
                        </div>
                      </div>

                      {/* QR Settings */}
                      <div className="order-1 lg:order-2 space-y-6">
                        {/* Default Link Type */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3">
                            <Link2 className="h-4 w-4 text-accent-color" />
                            <h4 className="font-bold text-sm">Default Link Type</h4>
                          </div>
                          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                            {(['view', 'embed', 'raw'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => setQrSettings(s => ({ ...s, defaultLinkType: type }))}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                  qrSettings.defaultLinkType === type ? 'bg-accent-color text-white' : 'text-white/40 hover:text-white'
                                }`}
                              >
                                {type === 'view' ? 'View Page' : type === 'embed' ? 'Embed' : 'Direct CDN'}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-white/30">
                            {qrSettings.defaultLinkType === 'view' && 'Links to the image viewer page with metadata'}
                            {qrSettings.defaultLinkType === 'embed' && 'Links to an embeddable image for sites/forums'}
                            {qrSettings.defaultLinkType === 'raw' && 'Links directly to the raw image file on CDN'}
                          </p>
                        </div>

                        {/* Colors */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3">
                            <Palette className="h-4 w-4 text-accent-color" />
                            <h4 className="font-bold text-sm">Colors</h4>
                          </div>
                          
                          {/* Use Accent Color Toggle */}
                          <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                            <div>
                              <p className="text-sm font-medium">Use App Accent Color</p>
                              <p className="text-[10px] text-white/40">Dynamically match your theme accent</p>
                            </div>
                            <button
                              onClick={() => setQrSettings(s => ({ ...s, useAccentColor: !s.useAccentColor }))}
                              className={`relative h-6 w-11 rounded-full transition-colors ${qrSettings.useAccentColor ? 'bg-accent-color' : 'bg-white/10'}`}
                            >
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${qrSettings.useAccentColor ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>

                          {!qrSettings.useAccentColor && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Foreground</label>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                                  <input
                                    type="color"
                                    value={qrSettings.fgColor}
                                    onChange={(e) => setQrSettings(s => ({ ...s, fgColor: e.target.value }))}
                                    className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                  />
                                  <input
                                    type="text"
                                    value={qrSettings.fgColor}
                                    onChange={(e) => setQrSettings(s => ({ ...s, fgColor: e.target.value }))}
                                    className="flex-1 bg-transparent text-xs font-mono focus:outline-none uppercase"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Background</label>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                                  <input
                                    type="color"
                                    value={qrSettings.bgColor}
                                    onChange={(e) => setQrSettings(s => ({ ...s, bgColor: e.target.value }))}
                                    className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                  />
                                  <input
                                    type="text"
                                    value={qrSettings.bgColor}
                                    onChange={(e) => setQrSettings(s => ({ ...s, bgColor: e.target.value }))}
                                    className="flex-1 bg-transparent text-xs font-mono focus:outline-none uppercase"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { fg: '#000000', bg: '#FFFFFF', label: 'Classic' },
                              { fg: '#FFFFFF', bg: '#000000', label: 'Inverted' },
                              { fg: '#FF6B00', bg: '#1A1A1A', label: 'Brand' },
                              { fg: '#6366F1', bg: '#F0F0FF', label: 'Purple' },
                              { fg: '#10B981', bg: '#ECFDF5', label: 'Green' },
                            ].map(preset => (
                              <button
                                key={preset.label}
                                onClick={() => setQrSettings(s => ({ ...s, fgColor: preset.fg, bgColor: preset.bg, useAccentColor: false }))}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                              >
                                <span className="h-3 w-3 rounded-full border border-white/10" style={{ background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)` }} />
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size & Quality */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3">
                            <Maximize className="h-4 w-4 text-accent-color" />
                            <h4 className="font-bold text-sm">Size & Quality</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Size</label>
                                <span className="text-xs font-mono text-white/60">{qrSettings.size}px</span>
                              </div>
                              <input
                                type="range"
                                min="100"
                                max="400"
                                value={qrSettings.size}
                                onChange={(e) => setQrSettings(s => ({ ...s, size: parseInt(e.target.value) }))}
                                className="w-full accent-accent-color"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Error Correction</label>
                              <div className="flex gap-2">
                                {(['L', 'M', 'Q', 'H'] as const).map(level => (
                                  <button
                                    key={level}
                                    onClick={() => setQrSettings(s => ({ ...s, errorCorrectionLevel: level }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                      qrSettings.errorCorrectionLevel === level ? 'bg-accent-color text-white' : 'bg-white/5 text-white/40 hover:text-white'
                                    }`}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-white/30">Higher = more redundancy, better for logos. L=7%, M=15%, Q=25%, H=30%</p>
                            </div>
                          </div>
                        </div>

                        {/* Corner Style */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3">
                            <Square className="h-4 w-4 text-accent-color" />
                            <h4 className="font-bold text-sm">Corner Style</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Corner Radius</label>
                              <span className="text-xs font-mono text-white/60">{qrSettings.cornerRadius}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="32"
                              value={qrSettings.cornerRadius}
                              onChange={(e) => setQrSettings(s => ({ ...s, cornerRadius: parseInt(e.target.value) }))}
                              className="w-full accent-accent-color"
                            />
                          </div>
                          <div className="flex gap-2">
                            {[
                              { value: 0, label: 'Sharp', icon: Square },
                              { value: 12, label: 'Soft', icon: Square },
                              { value: 24, label: 'Round', icon: Circle },
                            ].map(style => (
                              <button
                                key={style.value}
                                onClick={() => setQrSettings(s => ({ ...s, cornerRadius: style.value }))}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                  qrSettings.cornerRadius === style.value ? 'bg-accent-color text-white' : 'bg-white/5 text-white/40 hover:text-white'
                                }`}
                              >
                                <style.icon className="h-3 w-3" style={{ borderRadius: style.value > 0 ? '30%' : '0' }} />
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Logo Settings */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="h-4 w-4 text-accent-color" />
                              <h4 className="font-bold text-sm">Center Logo</h4>
                            </div>
                            <button
                              onClick={() => setQrSettings(s => ({ ...s, showLogo: !s.showLogo }))}
                              className={`relative h-6 w-11 rounded-full transition-colors ${qrSettings.showLogo ? 'bg-accent-color' : 'bg-white/10'}`}
                            >
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${qrSettings.showLogo ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                          {qrSettings.showLogo && (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Logo Size</label>
                                <span className="text-xs font-mono text-white/60">{qrSettings.logoSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="20"
                                max="80"
                                value={qrSettings.logoSize}
                                onChange={(e) => setQrSettings(s => ({ ...s, logoSize: parseInt(e.target.value) }))}
                                className="w-full accent-accent-color"
                              />
                              <p className="text-[10px] text-white/30">Keep logo under 30% of QR size for best scanning reliability</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                  {activeSection === "storage" && (
                <motion.div key="storage" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <SectionHeader icon={HardDrive} title="Storage Management" desc="Detailed breakdown of your asset storage across repositories." />
                  
                  <div className="p-8 rounded-3xl bg-accent-color/5 border border-accent-color/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-bold text-accent-color uppercase tracking-[0.2em] mb-1">Network Capacity</p>
                        <p className="text-4xl font-display uppercase">{formatFileSize(storageStats?.totalUsed || 0)} <span className="text-white/20">/ {formatFileSize(storageStats?.totalCapacity || 0)}</span></p>
                      </div>
                      <RefreshCw className="h-6 w-6 text-white/20 hover:text-white cursor-pointer transition-colors" onClick={loadStats} />
                    </div>
                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(storageStats?.percentUsed || 0, 100)}%` }}
                        className="h-full bg-gradient-to-r from-accent-color to-orange-500 rounded-full" 
                      />
                    </div>
                    <p className="text-xs text-white/40 font-medium">Auto-scaling active. {storageStats?.availableSpace ? formatFileSize(storageStats.availableSpace) : '...'} available until next repo creation.</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest">Active Repositories</h4>
                    <div className="grid gap-4">
                      {storageStats?.repos.map(repo => (
                        <div key={repo.name} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Database className="h-5 w-5 text-accent-color" />
                            <div>
                              <p className="font-bold">{repo.name}</p>
                              <p className="text-xs text-white/40">{repo.imageCount} images hosted</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatFileSize(repo.size)}</p>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{Math.round((repo.size / (800 * 1024 * 1024)) * 100)}% Full</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="glass-button py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4" /> Cleanup Storage
                    </button>
                    <button className="glass-button py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4" /> View on GitHub
                    </button>
                  </div>
                </motion.div>
              )}

              {activeSection === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <SectionHeader icon={Upload} title="Upload Preferences" desc="Customize how your images are processed during upload." />
                  
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Default Image Quality</label>
                      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {(["original", "high", "medium"] as const).map(q => (
                          <button
                            key={q}
                            onClick={() => updateSettings({ imageQuality: q })}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${settings.imageQuality === q ? "bg-accent-color text-white" : "text-white/40 hover:text-white"}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/30 italic">High and Medium quality will automatically compress your images to save space.</p>
                    </div>

                    <Toggle 
                      checked={settings.autoCompression} 
                      onChange={v => updateSettings({ autoCompression: v })} 
                      label="Auto-Compression" 
                      desc="Automatically optimize images for web delivery without significant quality loss." 
                    />
                    <Toggle 
                      checked={settings.generateThumbnails} 
                      onChange={v => updateSettings({ generateThumbnails: v })} 
                      label="Thumbnail Generation" 
                      desc="Create 200x200 thumbnails for faster gallery loading." 
                    />
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Link Preference</label>
                      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                        <button
                          onClick={() => updateSettings({ linkPreference: "temp" })}
                          className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${settings.linkPreference === "temp" ? "bg-accent-color text-white" : "text-white/40 hover:text-white"}`}
                        >
                          AniPic Redirect
                        </button>
                        <button
                          onClick={() => updateSettings({ linkPreference: "perma" })}
                          className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${settings.linkPreference === "perma" ? "bg-accent-color text-white" : "text-white/40 hover:text-white"}`}
                        >
                          GitHub Raw URL
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "api" && (
                <motion.div key="api" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <SectionHeader icon={Code2} title="API Access" desc="Manage your developer tokens and monitor usage." />
                  
                  <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Your API Token
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-accent-color text-sm">
                          {session?.user?.name || "login_required"}
                        </div>
                        <button 
                          onClick={copyToken}
                          className="p-4 rounded-2xl bg-accent-color text-white shadow-lg shadow-accent-color/20 hover:scale-105 transition-transform"
                        >
                          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-white/30 italic uppercase tracking-wider font-bold">Your GitHub username is used as your API token for simplicity.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Requests (30d)</p>
                        <p className="text-2xl font-display font-bold">1,240</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Bandwidth</p>
                        <p className="text-2xl font-display font-bold">850MB</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Uploads</p>
                        <p className="text-2xl font-display font-bold">342</p>
                      </div>
                    </div>

                    <a href="/#api-docs" className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-sm">Interactive API Documentation</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/20 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              )}

              {activeSection === "appearance" && (
                <motion.div key="appearance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <SectionHeader icon={Palette} title="Appearance Settings" desc="Personalize the visual experience of AniPic." />
                  
                  <div className="space-y-6">
                    {/* Theme Mode */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-accent-color" />
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Theme Mode</label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: "dark", label: "Deep Space", bg: "bg-zinc-900", preview: "#18181b" },
                          { id: "midnight", label: "Midnight", bg: "bg-slate-950", preview: "#0a0a14" },
                          { id: "amoled", label: "OLED Black", bg: "bg-black", preview: "#000000" },
                          { id: "light", label: "Daylight", bg: "bg-gray-100", preview: "#f8f9fa", dark: false },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => updateSettings({ theme: t.id as any })}
                            className={`p-4 rounded-xl border transition-all text-center space-y-3 ${settings.theme === t.id ? "border-accent-color bg-accent-color/5 ring-2 ring-accent-color/20" : "border-white/5 hover:bg-white/5"}`}
                          >
                            <div className={`h-10 w-full rounded-lg border border-white/10 flex items-center justify-center`} style={{ background: t.preview }}>
                              {t.dark === false ? (
                                <div className="h-4 w-4 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
                              ) : (
                                <div className="flex gap-0.5">
                                  <div className="h-1 w-1 rounded-full bg-white/40" />
                                  <div className="h-1 w-1 rounded-full bg-white/20" />
                                  <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent Colors */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Palette className="h-4 w-4 text-accent-color" />
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Accent Color</label>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
                        {(Object.keys(accentColors) as AccentColor[]).map(color => (
                          <button
                            key={color}
                            onClick={() => updateSettings({ accentColor: color })}
                            className={`group relative aspect-square rounded-xl border-2 transition-all ${
                              settings.accentColor === color 
                                ? "border-white scale-105 shadow-lg" 
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ background: accentColors[color].hex }}
                          >
                            {settings.accentColor === color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="h-5 w-5 text-white drop-shadow-lg" />
                              </div>
                            )}
                            <span className="sr-only">{accentColors[color].name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: accentColors[settings.accentColor].hex }} />
                        <span className="text-xs font-medium text-white/60">{accentColors[settings.accentColor].name}</span>
                        <span className="text-xs font-mono text-white/30 ml-auto">{accentColors[settings.accentColor].hex}</span>
                      </div>
                    </div>

                    {/* Animation Mode */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5" /> Animation Mode
                      </label>
                      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {(["auto", "on", "off"] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => updateSettings({ reducedAnimationsMode: m })}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${settings.reducedAnimationsMode === m ? "bg-accent-color text-white" : "text-white/40 hover:text-white"}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/30 italic">AUTO mode uses battery detection to disable animations below 20%.</p>
                    </div>

                    {/* Gallery Layout */}
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Gallery Layout</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "compact", icon: LayoutGrid, label: "Compact" },
                          { id: "comfortable", icon: Layout, label: "Default" },
                          { id: "immersive", icon: Maximize, label: "Immersive" },
                        ].map(l => (
                          <button
                            key={l.id}
                            onClick={() => updateSettings({ layoutMode: l.id as any })}
                            className={`p-4 rounded-xl border transition-all text-center space-y-2 ${settings.layoutMode === l.id ? "border-accent-color bg-accent-color/5" : "border-white/5 hover:bg-white/5"}`}
                          >
                            <l.icon className="h-6 w-6 mx-auto text-white/40" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">{l.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "privacy" && (
                <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <SectionHeader icon={Shield} title="Privacy & Security" desc="Control your visibility and content protection." />
                  
                  <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-red-500 uppercase tracking-widest text-sm">Critical Notice</h4>
                      <p className="text-xs text-white/60 leading-relaxed mt-1">AniPic is designed for public sharing. All assets uploaded are stored in public repositories for CDN performance. Never upload sensitive or private data.</p>
                    </div>
                  </div>

                  <Toggle 
                    checked={settings.showUsername} 
                    onChange={v => updateSettings({ showUsername: v })} 
                    label="Display Username" 
                    desc="Show your GitHub username on the public viewing page of your assets." 
                  />
                  <Toggle 
                    checked={settings.publicIndexing} 
                    onChange={v => updateSettings({ publicIndexing: v })} 
                    label="Allow Search Indexing" 
                    desc="Enable search engines like Google to index your public asset pages." 
                  />
                </motion.div>
              )}

              {activeSection === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <SectionHeader icon={Bell} title="Notifications" desc="Set up how you want to be alerted about storage and API." />
                  
                  <div className="space-y-4">
                    <Toggle 
                      checked={settings.emailNotifications} 
                      onChange={v => updateSettings({ emailNotifications: v })} 
                      label="Email Alerts" 
                      desc="Receive emails about storage limits, repository auto-creation, and API usage warnings." 
                    />
                    
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">In-App Notifications</label>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                          <span className="text-sm font-medium">New Repository Alerts</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent-color" />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                          <span className="text-sm font-medium">API Limit Warnings</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent-color" />
                        </label>
                        <label className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                          <span className="text-sm font-medium">Weekly Usage Summaries</span>
                          <input type="checkbox" className="w-4 h-4 accent-accent-color" />
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "danger" && (
                <motion.div key="danger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <SectionHeader icon={AlertTriangle} title="Danger Zone" desc="Destructive actions that cannot be undone." />
                  
                  <div className="p-10 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 text-center space-y-6">
                    <Trash2 className="h-16 w-16 text-red-500 mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold uppercase">Purge All Assets</h3>
                      <p className="text-white/40 max-w-sm mx-auto text-sm mt-2">This will permanently delete all image metadata from AniPic. GitHub repositories must be deleted manually from your account.</p>
                    </div>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-red-500/20 active:scale-95">
                      Confirm Full Purge
                    </button>
                  </div>

                  <div className="p-10 rounded-[2.5rem] bg-zinc-900 border border-white/5 text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold uppercase">Delete Account</h3>
                      <p className="text-white/40 max-w-sm mx-auto text-sm mt-2">Disconnect your GitHub and delete your AniPic profile. Your existing uploads will remain on GitHub but will be removed from AniPic.</p>
                    </div>
                    <button className="glass-button text-red-500 font-bold py-4 px-10 rounded-2xl transition-all hover:bg-red-500/10 border-red-500/20">
                      Delete Account Forever
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* New Album Modal */}
      <AnimatePresence>
        {showNewAlbumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewAlbumModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-strong rounded-3xl p-8 border border-white/10"
            >
              <button onClick={() => setShowNewAlbumModal(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-white/40" />
              </button>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <FolderPlus className="h-6 w-6 text-accent-color" />
                Create New Album
              </h3>
              <p className="text-white/40 text-sm mb-6">Organize your images into collections for easy access.</p>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Enter album name..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-accent-color/50 transition-colors mb-6"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createAlbum()}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNewAlbumModal(false)}
                  className="flex-1 glass-button py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={createAlbum}
                  disabled={!newAlbumName.trim() || creatingAlbum}
                  className="flex-1 btn-primary py-4 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
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
    </> 
  );
}
