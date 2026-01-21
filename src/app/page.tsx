"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  Image as ImageIcon, 
  Github,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  HardDrive,
  TrendingUp,
  Database,
  Check,
  Images,
  FileCode,
  Copy,
  ChevronRight,
  Code2,
  Terminal,
  Menu,
  X,
  Settings,
  User,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { HeroWordmark } from "@/components/HeroWordmark";
import { UploadModal, ImageCard, EmptyGallery } from "@/components/AniPicComponents";
import { getPublicImages, getStorageStats, formatFileSize, type ImageMetadata, type StorageStats } from "@/lib/github";
import { useSettings } from "@/lib/settings-context";
import { useBattery } from "@/hooks/use-battery";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

function SocialToast({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-[100] max-w-sm glass-strong rounded-2xl border border-white/10 p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent-color/20 flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5 text-accent-color" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white mb-1">Join Our Community!</h4>
          <p className="text-xs text-white/50 mb-3">Connect with us for updates, support & more</p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://instagram.com/Aniflix.in_"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://instagram.com/Aniflix.in_" } }, "*");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
            <a
              href="https://t.me/Anipic_official"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://t.me/Anipic_official" } }, "*");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </a>
            <a
              href="https://discord.gg/USEvkrNGuF"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://discord.gg/USEvkrNGuF" } }, "*");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2] text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
              Discord
            </a>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <X className="h-4 w-4 text-white/50" />
        </button>
      </div>
    </motion.div>
  );
}

function Header({ onUploadClick }: { onUploadClick: () => void }) {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-[60] header-blur border-b border-white/5">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/">
          <Logo size="md" />
        </a>

        <nav className="hidden md:flex items-center gap-1">
          <a href="/" className="nav-link">Home</a>
          <a href="/gallery" className="nav-link">Gallery</a>
          <a href="/docs" className="nav-link">API Docs</a>
          <a href="/settings" className="nav-link">Settings</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onUploadClick}
            className="btn-primary flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-accent-color/20"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Upload</span>
          </button>

          {session ? (
            <a href="/settings" className="hidden sm:flex items-center gap-2 glass-button px-3 py-2 rounded-xl">
              <img src={session.user?.image || ""} className="h-6 w-6 rounded-full" alt="" />
              <span className="text-sm font-medium truncate max-w-[100px]">{session.user?.name}</span>
            </a>
          ) : (
            <button onClick={() => signIn("github")} className="hidden sm:flex items-center gap-2 glass-button px-4 py-2 rounded-xl text-sm font-bold">
              <Github className="h-4 w-4" />
              Login
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col p-4 gap-2">
              <a href="/" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium transition-colors">Home</a>
              <a href="/gallery" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium transition-colors">Gallery</a>
              <a href="/docs" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium transition-colors">API Docs</a>
              <a href="/settings" className="px-4 py-3 rounded-xl hover:bg-white/5 font-medium transition-colors">Settings</a>
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
  );
}

function StatCard({ stat, index }: { stat: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="stat-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center backdrop-blur-md border border-white/5 hover:border-accent-color/30 transition-all duration-300"
    >
      <stat.icon className={`mx-auto mb-2 sm:mb-3 h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
      <div className="font-display text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
        {stat.value}
        <span className="text-xs sm:text-sm ml-0.5 sm:ml-1 text-white/50">{stat.suffix}</span>
      </div>
      <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider font-semibold">{stat.label}</p>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-8 group hover:scale-[1.02] transition-all duration-300"
    >
      <div className="feature-icon h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
        <feature.icon className={`h-5 w-5 sm:h-7 sm:w-7 ${feature.color}`} />
      </div>
      <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3 font-heading">{feature.title}</h3>
      <p className="text-sm sm:text-base text-white/50 leading-relaxed font-body">{feature.description}</p>
    </motion.div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const { isLow } = useBattery();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js' | 'py'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSocialToast, setShowSocialToast] = useState(false);

  useEffect(() => {
    loadData();
    const hasSeenToast = localStorage.getItem('anipic-social-toast-seen');
    if (!hasSeenToast) {
      const timer = setTimeout(() => {
        setShowSocialToast(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseSocialToast = () => {
    setShowSocialToast(false);
    localStorage.setItem('anipic-social-toast-seen', 'true');
  };

  const loadData = async () => {
    setIsLoading(true);
    const [publicImages, stats] = await Promise.all([
      getPublicImages(),
      getStorageStats()
    ]);
    setImages(publicImages);
    setStorageStats(stats);
    setIsLoading(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploadModalOpen(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: true
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST "https://api.anipic.com/v1/upload" \\
  -H "Authorization: Bearer YOUR_GITHUB_USERNAME" \\
  -F "file=@photo.jpg" \\
  -F "album=vacation-2026"`,
    js: `const res = await fetch('https://api.anipic.com/v1/upload', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_GITHUB_USERNAME' },
  body: formData
});`,
    py: `import requests
res = requests.post(
  'https://api.anipic.com/v1/upload',
  headers={'Authorization': 'Bearer YOUR_GITHUB_USERNAME'},
  files={'file': open('photo.jpg', 'rb')}
)`
  };

  const stats = [
    { value: images.length, suffix: "", label: "Images Uploaded", icon: ImageIcon, color: "text-rose-400" },
    { value: Math.round((storageStats?.totalUsed || 0) / (1024 * 1024)), suffix: "MB", label: "Data Served", icon: TrendingUp, color: "text-emerald-400" },
    { value: storageStats?.repos.length || 1, suffix: "", label: "Active Repos", icon: Database, color: "text-violet-400" },
    { value: 99.9, suffix: "%", label: "Global Uptime", icon: Globe, color: "text-blue-400" },
  ];

  const features = [
    { icon: Zap, title: "Lightning Fast", description: "Images served via global GitHub CDN with instant propagation.", color: "text-amber-400" },
    { icon: Shield, title: "100% Free", description: "No hidden costs, no storage limits, no bandwidth caps. Ever.", color: "text-emerald-400" },
    { icon: Globe, title: "Short Links", description: "Beautifully formatted links that look professional anywhere.", color: "text-blue-400" },
    { icon: Code2, title: "Developer API", description: "Robust REST API for programmatic image management.", color: "text-violet-400" },
  ];

  return (
    <div className="min-h-screen bg-[#030304] text-white selection:bg-accent-color/30" {...getRootProps()}>
      <input {...getInputProps()} />
      
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-color/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="bg-grid-subtle absolute inset-0 opacity-20" />
      </div>

      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <HeroWordmark />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white/60 text-sm sm:text-lg md:text-xl font-medium tracking-wide mb-6 sm:mb-10 px-4"
          >
            Lightning-Fast Image CDN <span className="mx-1 sm:mx-2 text-white/20">•</span> Unlimited Storage <span className="mx-1 sm:mx-2 text-white/20">•</span> Free Forever
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-12 sm:mb-20 px-4"
          >
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold group"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Upload Now
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="/gallery" className="glass-button flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold">
              <Images className="h-4 w-4 sm:h-5 sm:w-5" />
              View Gallery
            </a>
            <button
              onClick={() => document.getElementById('api-docs')?.scrollIntoView({ behavior: 'smooth' })}
              className="glass-button flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold"
            >
              <FileCode className="h-4 w-4 sm:h-5 sm:w-5" />
              API Docs
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className={`max-w-3xl mx-auto rounded-2xl sm:rounded-3xl border-2 border-dashed p-8 sm:p-12 transition-all duration-500 cursor-pointer ${
              isDragActive ? "border-accent-color bg-accent-color/5 scale-[1.02]" : "border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
            onClick={() => setIsUploadModalOpen(true)}
          >
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <p className="text-base sm:text-xl font-bold">Drop images to instantly upload</p>
                <p className="text-white/40 text-sm sm:text-base">or click to select files from your device</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20 px-4 sm:px-6 border-y border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10 sm:mb-16">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          <div className="max-w-2xl mx-auto px-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-color" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/60">Public Storage Pool</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-accent-color">
                {formatFileSize(storageStats?.totalUsed || 0)} used ({storageStats?.repos.length || 0} repos active)
              </span>
            </div>
            <div className="h-2 sm:h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(storageStats?.percentUsed || 0, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent-color to-orange-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-display uppercase mb-4 sm:mb-6 leading-none">
                Why <span className="text-accent-color">AniPic</span>?
              </h2>
              <p className="text-base sm:text-xl text-white/50 font-body">
                The ultimate image hosting solution for developers, creators, and everyone else who values speed and simplicity.
              </p>
            </div>
            <div className="flex gap-2 self-start md:self-end">
              <div className="h-1 w-12 sm:w-20 bg-accent-color rounded-full" />
              <div className="h-1 w-8 sm:w-12 bg-white/10 rounded-full" />
              <div className="h-1 w-4 sm:w-8 bg-white/10 rounded-full" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section id="api-docs" className="py-16 sm:py-32 px-4 sm:px-6 bg-accent-color/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent-color/10 border border-accent-color/20 text-accent-color text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
                <Terminal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Developer API
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-display uppercase mb-6 sm:mb-8 leading-none">
                Built for <span className="text-accent-color">Developers</span>
              </h2>
              <p className="text-sm sm:text-lg text-white/50 mb-6 sm:mb-8 font-body leading-relaxed">
                Integrate AniPic into your apps, websites, or CLI tools in minutes. Our simple REST API handles everything from uploads to storage management.
              </p>
              
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                {[
                  "Secure GitHub OAuth Authentication",
                  "Automatic Repository Sequential Scaling",
                  "Programmatic Album Creation",
                  "Instant CDN Link Generation"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-white/80">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

<a href="/docs" className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold inline-flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                  Read Full Documentation
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
            </div>

            <div className="glass-strong rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-rose-500/50" />
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-amber-500/50" />
                  <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  {(['curl', 'js', 'py'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveCodeTab(tab)}
                      className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${activeCodeTab === tab ? "text-accent-color" : "text-white/40 hover:text-white"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 sm:p-8 relative group">
                <button
                  onClick={() => copyCode(codeSnippets[activeCodeTab])}
                  className="absolute top-3 sm:top-6 right-3 sm:right-6 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                >
                  {copiedCode ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
                <pre className="font-mono text-xs sm:text-sm leading-relaxed text-blue-400 overflow-x-auto">
                  <code>{codeSnippets[activeCodeTab]}</code>
                </pre>
              </div>
              <div className="px-4 sm:px-8 py-4 sm:py-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] sm:text-xs text-white/40">v1.0.0 Stable</span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/40">Rate limit: 1000 req/hr</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-32 overflow-hidden">
          <div className="px-4 sm:px-6 mb-8 sm:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display uppercase">Recent <span className="text-accent-color">Uploads</span></h2>
            <a href="/gallery" className="text-accent-color font-bold flex items-center gap-2 group text-sm sm:text-base">
              See all
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
          
          {/* Bento Grid Layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 auto-rows-[120px] sm:auto-rows-[160px]">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className={`rounded-2xl sm:rounded-3xl bg-white/5 animate-pulse ${i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'col-span-2' : ''}`} />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon className="h-16 w-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/40">No public images uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 auto-rows-[120px] sm:auto-rows-[160px]">
                {/* Large Featured Card */}
                {images[0] && (
                  <motion.a
                    href={`/i/${images[0].imageId}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="col-span-2 row-span-2 group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-accent-color/20 to-transparent"
                  >
                    <img src={images[0].rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full bg-accent-color/20 text-accent-color text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Featured</span>
                      </div>
                      <p className="font-bold text-lg sm:text-xl">{images[0].imageId}</p>
                      <p className="text-white/50 text-xs sm:text-sm truncate">{images[0].filename}</p>
                    </div>
                  </motion.a>
                )}

                {/* Medium Cards */}
                {images.slice(1, 3).map((img, i) => (
                  <motion.a
                    key={img.imageId}
                    href={`/i/${img.imageId}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="col-span-1 row-span-1 group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5"
                  >
                    <img src={img.rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-bold truncate">{img.imageId}</p>
                    </div>
                  </motion.a>
                ))}

                {/* Wide Card */}
                {images[3] && (
                  <motion.a
                    href={`/i/${images[3].imageId}`}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="col-span-2 row-span-1 group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5"
                  >
                    <img src={images[3].rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-sm font-bold">{images[3].imageId}</p>
                      <p className="text-[10px] text-white/50">{images[3].filename}</p>
                    </div>
                  </motion.a>
                )}

                {/* Remaining Small Cards */}
                {images.slice(4, 8).map((img, i) => (
                  <motion.a
                    key={img.imageId}
                    href={`/i/${img.imageId}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="col-span-1 row-span-1 group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5 hover:border-accent-color/30 transition-colors"
                  >
                    <img src={img.rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">{img.imageId}</span>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          {/* Sliding Carousel */}
          {images.length > 8 && (
            <div className="mt-8 sm:mt-12">
              <div className="flex gap-3 sm:gap-4 animate-scroll whitespace-nowrap px-4 sm:px-6">
                {images.slice(8, 20).map((img) => (
                  <a
                    key={img.imageId}
                    href={`/i/${img.imageId}`}
                    className="min-w-[140px] sm:min-w-[200px] h-[100px] sm:h-[140px] group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5 shrink-0"
                  >
                    <img src={img.rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs font-bold">{img.imageId}</p>
                    </div>
                  </a>
                ))}
                {/* Duplicate for infinite scroll */}
                {images.slice(8, 20).map((img) => (
                  <a
                    key={`dup-${img.imageId}`}
                    href={`/i/${img.imageId}`}
                    className="min-w-[140px] sm:min-w-[200px] h-[100px] sm:h-[140px] group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/5 shrink-0"
                  >
                    <img src={img.rawUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs font-bold">{img.imageId}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8">
            <a href="/">
              <Logo size="md" />
            </a>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/40 font-bold uppercase tracking-widest">
              <a href="/gallery" className="hover:text-white transition-colors">Gallery</a>
              <a href="/docs" className="hover:text-white transition-colors">API Docs</a>
              <a href="/settings" className="hover:text-white transition-colors">Settings</a>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Systems Operational
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-white/60 text-sm font-medium mb-1">Made with love by <span className="text-accent-color font-bold">Aniflix Developer Team</span></p>
                <p className="text-white/30 text-xs">Part of the Aniflix ecosystem</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="https://aniflix.in"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://aniflix.in" } }, "*"); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Aniflix
                </a>
                <a
                  href="https://arise.aniflix.in"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://arise.aniflix.in" } }, "*"); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Arise
                </a>
                <a
                  href="https://anireads.aniflix.in"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://anireads.aniflix.in" } }, "*"); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  AniReads
                </a>
                <a
                  href="https://ani-stream.aniflix.in"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://ani-stream.aniflix.in" } }, "*"); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  AniStream
                </a>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/Aniflix.in_"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://instagram.com/Aniflix.in_" } }, "*"); }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Instagram"
                >
                  <svg className="h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://t.me/Anipic_official"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://t.me/Anipic_official" } }, "*"); }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Telegram"
                >
                  <svg className="h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
                <a
                  href="https://discord.gg/USEvkrNGuF"
                  onClick={(e) => { e.preventDefault(); window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://discord.gg/USEvkrNGuF" } }, "*"); }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Discord"
                >
                  <svg className="h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showSocialToast && <SocialToast onClose={handleCloseSocialToast} />}
      </AnimatePresence>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={loadData}
      />

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
