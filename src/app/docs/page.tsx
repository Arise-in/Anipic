"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Code2,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  Zap,
  Shield,
  Globe,
  Upload,
  Download,
  Link2,
  QrCode,
  Tag,
  BarChart3,
  Database,
  Users,
  Key,
  ArrowLeft,
  ExternalLink,
  Play,
  BookOpen,
  Layers,
  Palette,
  Maximize2,
} from "lucide-react";
import Logo from "@/components/Logo";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  parameters?: Record<string, any>;
  body?: Record<string, any>;
  response?: any;
  contentType?: string;
}

interface EndpointCategory {
  [key: string]: Endpoint;
}

interface ApiDocs {
  name: string;
  version: string;
  baseUrl: string;
  authentication: {
    type: string;
    header: string;
    note: string;
  };
  endpoints: Record<string, EndpointCategory>;
  rateLimits: Record<string, string>;
  errors: Record<string, { code: string; message: string }>;
}

const categoryIcons: Record<string, any> = {
  images: ImageIcon,
  upload: Upload,
  random: Zap,
  search: Search,
  qr: QrCode,
  embed: Code2,
  shortlink: Link2,
  metadata: Database,
  tags: Tag,
  resize: Maximize2,
  transform: Palette,
  stats: BarChart3,
  storage: Database,
  bulk: Layers,
  albums: ImageIcon,
  user: Users,
  health: Shield,
  oembed: Globe,
};

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  PATCH: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export default function DocsPage() {
  const [docs, setDocs] = useState<ApiDocs | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("images");
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["images"]));
  const [activeCodeLang, setActiveCodeLang] = useState<"curl" | "js" | "py">("curl");

  useEffect(() => {
    fetch("/api/v1/docs")
      .then((r) => r.json())
      .then(setDocs);
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
    setActiveCategory(category);
  };

  const generateCodeExample = (endpoint: Endpoint, baseUrl: string) => {
    const fullPath = `${baseUrl}${endpoint.path}`;
    const hasParams = endpoint.parameters && Object.keys(endpoint.parameters).length > 0;
    const exampleParams = hasParams
      ? "?" + Object.entries(endpoint.parameters || {}).slice(0, 2).map(([k]) => `${k}=example`).join("&")
      : "";

    const examples = {
      curl: endpoint.method === "GET"
        ? `curl -X GET "${fullPath}${exampleParams}" \\
  -H "Accept: application/json"${endpoint.auth ? ' \\\n  -H "Authorization: Bearer YOUR_GITHUB_USERNAME"' : ""}`
        : `curl -X ${endpoint.method} "${fullPath}" \\
  -H "Content-Type: ${endpoint.contentType || "application/json"}" \\
  -H "Authorization: Bearer YOUR_GITHUB_USERNAME"${endpoint.body ? ` \\
  -d '${JSON.stringify(Object.fromEntries(Object.entries(endpoint.body).map(([k, v]: [string, any]) => [k, v.type === "File" ? "@image.jpg" : "example"])), null, 2)}'` : ""}`,
      js: endpoint.method === "GET"
        ? `const response = await fetch("${fullPath}${exampleParams}"${endpoint.auth ? `, {
  headers: { "Authorization": "Bearer YOUR_GITHUB_USERNAME" }
}` : ""});
const data = await response.json();
console.log(data);`
        : `const response = await fetch("${fullPath}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "${endpoint.contentType || "application/json"}",
    "Authorization": "Bearer YOUR_GITHUB_USERNAME"
  },
  body: ${endpoint.contentType === "multipart/form-data" ? "formData" : `JSON.stringify(${JSON.stringify(Object.fromEntries(Object.entries(endpoint.body || {}).map(([k, v]: [string, any]) => [k, "example"])), null, 4)})`}
});`,
      py: endpoint.method === "GET"
        ? `import requests

response = requests.get(
    "${fullPath}${exampleParams}"${endpoint.auth ? `,
    headers={"Authorization": "Bearer YOUR_GITHUB_USERNAME"}` : ""}
)
print(response.json())`
        : `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${fullPath}",
    headers={"Authorization": "Bearer YOUR_GITHUB_USERNAME"},
    ${endpoint.contentType === "multipart/form-data" ? 'files={"file": open("image.jpg", "rb")}' : `json=${JSON.stringify(Object.fromEntries(Object.entries(endpoint.body || {}).map(([k, v]: [string, any]) => [k, "example"])))}`}
)
print(response.json())`,
    };
    return examples;
  };

  const filteredCategories = docs
    ? Object.entries(docs.endpoints).filter(([category, endpoints]) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        if (category.toLowerCase().includes(query)) return true;
        return Object.values(endpoints).some(
          (ep: any) =>
            ep.path?.toLowerCase().includes(query) ||
            ep.description?.toLowerCase().includes(query)
        );
      })
    : [];

  if (!docs) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-accent-color/20" />
          <span className="text-white/40">Loading documentation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030304] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 header-blur border-b border-white/5">
        <div className="max-w-[1800px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/">
              <Logo size="sm" />
            </a>
            <div className="hidden sm:flex items-center gap-1 text-white/40">
              <ChevronRight className="h-4 w-4" />
              <span className="text-white font-medium">API Documentation</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm w-48 lg:w-64 focus:outline-none focus:border-accent-color/50 placeholder:text-white/30"
              />
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to App</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        <aside className="fixed left-0 top-14 bottom-0 w-72 border-r border-white/5 bg-black/40 backdrop-blur-xl overflow-y-auto hidden lg:block">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-accent-color" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Getting Started</span>
              </div>
              <nav className="space-y-1">
                <a href="#authentication" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  Authentication
                </a>
                <a href="#rate-limits" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  Rate Limits
                </a>
                <a href="#errors" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  Error Handling
                </a>
              </nav>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-accent-color" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Endpoints</span>
              </div>
              <nav className="space-y-1">
                {filteredCategories.map(([category, endpoints]) => {
                  const Icon = categoryIcons[category] || Code2;
                  const isExpanded = expandedCategories.has(category);
                  return (
                    <div key={category}>
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategory === category
                            ? "bg-accent-color/10 text-accent-color"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{category}</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-6 py-1 space-y-1">
                              {Object.entries(endpoints).map(([name, endpoint]: [string, any]) => (
                                <button
                                  key={name}
                                  onClick={() => setActiveEndpoint(`${category}-${name}`)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                                    activeEndpoint === `${category}-${name}`
                                      ? "bg-white/10 text-white"
                                      : "text-white/40 hover:text-white/70"
                                  }`}
                                >
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${methodColors[endpoint.method]}`}>
                                    {endpoint.method}
                                  </span>
                                  <span className="truncate">{name}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-72 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent-color to-orange-500 flex items-center justify-center">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-display uppercase">{docs.name}</h1>
                  <p className="text-white/40 text-sm">Version {docs.version}</p>
                </div>
              </div>
              <p className="text-white/60 text-lg max-w-2xl">
                Complete REST API for programmatic image hosting, management, and retrieval. 
                Build powerful integrations with our comprehensive endpoints.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
                  <span className="text-white/40">Base URL:</span>{" "}
                  <code className="text-accent-color font-mono">{docs.baseUrl}</code>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                  <span className="mr-2">●</span> All systems operational
                </div>
              </div>
            </motion.div>

            <section id="authentication" className="mb-16">
              <h2 className="text-2xl font-display uppercase mb-6 flex items-center gap-3">
                <Key className="h-6 w-6 text-accent-color" />
                Authentication
              </h2>
              <div className="glass-card rounded-2xl p-6 border border-white/10">
                <p className="text-white/60 mb-4">{docs.authentication.note}</p>
                <div className="bg-black/40 rounded-xl p-4 font-mono text-sm">
                  <span className="text-white/40">Header:</span>{" "}
                  <span className="text-emerald-400">{docs.authentication.header}</span>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400 text-sm">
                    <strong>Note:</strong> Replace YOUR_GITHUB_USERNAME with your actual GitHub username for authenticated endpoints.
                  </p>
                </div>
              </div>
            </section>

            <section id="rate-limits" className="mb-16">
              <h2 className="text-2xl font-display uppercase mb-6 flex items-center gap-3">
                <Zap className="h-6 w-6 text-accent-color" />
                Rate Limits
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(docs.rateLimits).map(([key, value]) => (
                  <div key={key} className="glass-card rounded-xl p-4 border border-white/10">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{key}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="errors" className="mb-16">
              <h2 className="text-2xl font-display uppercase mb-6 flex items-center gap-3">
                <Shield className="h-6 w-6 text-accent-color" />
                Error Codes
              </h2>
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-white/40">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-white/40">Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-white/40">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(docs.errors).map(([status, error]) => (
                      <tr key={status} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            parseInt(status) >= 500 ? "bg-rose-500/20 text-rose-400" :
                            parseInt(status) >= 400 ? "bg-amber-500/20 text-amber-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white/80">{error.code}</td>
                        <td className="px-6 py-4 text-white/60">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="endpoints" className="mb-16">
              <h2 className="text-2xl font-display uppercase mb-6 flex items-center gap-3">
                <Code2 className="h-6 w-6 text-accent-color" />
                API Endpoints
              </h2>

              {filteredCategories.map(([category, endpoints]) => {
                const Icon = categoryIcons[category] || Code2;
                return (
                  <div key={category} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-accent-color/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-accent-color" />
                      </div>
                      <h3 className="text-xl font-bold capitalize">{category}</h3>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(endpoints).map(([name, endpoint]: [string, any]) => {
                        const codeExamples = generateCodeExample(endpoint, docs.baseUrl);
                        const isActive = activeEndpoint === `${category}-${name}`;

                        return (
                          <motion.div
                            key={name}
                            layout
                            className="glass-card rounded-2xl border border-white/10 overflow-hidden"
                          >
                            <button
                              onClick={() => setActiveEndpoint(isActive ? null : `${category}-${name}`)}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${methodColors[endpoint.method]}`}>
                                  {endpoint.method}
                                </span>
                                <code className="font-mono text-sm text-white/80">{endpoint.path}</code>
                                {endpoint.auth && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">
                                    Auth Required
                                  </span>
                                )}
                              </div>
                              <ChevronDown className={`h-5 w-5 text-white/40 transition-transform ${isActive ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/10"
                                >
                                  <div className="p-6">
                                    <p className="text-white/60 mb-6">{endpoint.description}</p>

                                    {endpoint.parameters && Object.keys(endpoint.parameters).length > 0 && (
                                      <div className="mb-6">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Parameters</h4>
                                        <div className="bg-black/40 rounded-xl overflow-hidden">
                                          <table className="w-full">
                                            <thead>
                                              <tr className="border-b border-white/10">
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Name</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Type</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Default</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Description</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {Object.entries(endpoint.parameters).map(([param, config]: [string, any]) => (
                                                <tr key={param} className="border-b border-white/5">
                                                  <td className="px-4 py-2 font-mono text-sm text-accent-color">{param}</td>
                                                  <td className="px-4 py-2 text-sm text-white/60">{config.type}</td>
                                                  <td className="px-4 py-2 text-sm text-white/40">{config.default ?? "-"}</td>
                                                  <td className="px-4 py-2 text-sm text-white/60">
                                                    {config.description}
                                                    {config.options && (
                                                      <span className="block text-xs text-white/30 mt-1">
                                                        Options: {config.options.join(", ")}
                                                      </span>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {endpoint.body && Object.keys(endpoint.body).length > 0 && (
                                      <div className="mb-6">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Request Body</h4>
                                        <div className="bg-black/40 rounded-xl overflow-hidden">
                                          <table className="w-full">
                                            <thead>
                                              <tr className="border-b border-white/10">
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Field</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Type</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Required</th>
                                                <th className="px-4 py-2 text-left text-xs text-white/40">Description</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {Object.entries(endpoint.body).map(([field, config]: [string, any]) => (
                                                <tr key={field} className="border-b border-white/5">
                                                  <td className="px-4 py-2 font-mono text-sm text-accent-color">{field}</td>
                                                  <td className="px-4 py-2 text-sm text-white/60">{config.type}</td>
                                                  <td className="px-4 py-2 text-sm">
                                                    {config.required ? (
                                                      <span className="text-rose-400">Yes</span>
                                                    ) : (
                                                      <span className="text-white/40">No</span>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-2 text-sm text-white/60">{config.description}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Code Example</h4>
                                        <div className="flex gap-2">
                                          {(["curl", "js", "py"] as const).map((lang) => (
                                            <button
                                              key={lang}
                                              onClick={() => setActiveCodeLang(lang)}
                                              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                                                activeCodeLang === lang
                                                  ? "bg-accent-color/20 text-accent-color"
                                                  : "text-white/40 hover:text-white"
                                              }`}
                                            >
                                              {lang}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="relative">
                                        <button
                                          onClick={() => copyCode(codeExamples[activeCodeLang], `${category}-${name}`)}
                                          className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                          {copiedCode === `${category}-${name}` ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                          ) : (
                                            <Copy className="h-4 w-4 text-white/40" />
                                          )}
                                        </button>
                                        <pre className="bg-black/60 rounded-xl p-4 overflow-x-auto">
                                          <code className="text-sm font-mono text-blue-400">
                                            {codeExamples[activeCodeLang]}
                                          </code>
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="glass-card rounded-3xl p-8 border border-accent-color/20 bg-gradient-to-br from-accent-color/5 to-transparent">
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 rounded-2xl bg-accent-color/20 flex items-center justify-center shrink-0">
                  <Play className="h-8 w-8 text-accent-color" />
                </div>
                <div>
                  <h3 className="text-2xl font-display uppercase mb-2">Try it Live</h3>
                  <p className="text-white/60 mb-4">
                    Test our API endpoints directly in your browser. No authentication required for public endpoints.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/api/v1/images?limit=5"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      /api/v1/images
                      <ExternalLink className="h-3 w-3 text-white/40" />
                    </a>
                    <a
                      href="/api/v1/stats"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      /api/v1/stats
                      <ExternalLink className="h-3 w-3 text-white/40" />
                    </a>
                    <a
                      href="/api/v1/tags"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      /api/v1/tags
                      <ExternalLink className="h-3 w-3 text-white/40" />
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
