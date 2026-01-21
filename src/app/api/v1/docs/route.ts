import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') || req.headers.get('host') || '';
  const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

  const docs = {
    name: "AniPic API",
    version: "1.0.0",
    baseUrl: `${baseUrl}/api/v1`,
    documentation: `${baseUrl}/docs`,
    authentication: {
      type: "Bearer Token",
      header: "Authorization: Bearer YOUR_GITHUB_USERNAME",
      note: "Some endpoints require authentication. For public endpoints, authentication is optional but recommended."
    },
    endpoints: {
      images: {
        list: {
          method: "GET",
          path: "/images",
          description: "List all public images with pagination",
          parameters: {
            page: { type: "number", default: 1, description: "Page number" },
            limit: { type: "number", default: 50, max: 100, description: "Items per page" },
            sort: { type: "string", options: ["newest", "oldest", "largest", "smallest"], default: "newest" },
            search: { type: "string", description: "Search by filename, ID, or uploader" }
          }
        },
        get: {
          method: "GET",
          path: "/images/:imageId",
          description: "Get a single image by ID with all metadata and links"
        },
        delete: {
          method: "DELETE",
          path: "/images/:imageId",
          auth: true,
          description: "Delete an image by ID (owner only)"
        }
      },
      upload: {
        file: {
          method: "POST",
          path: "/upload",
          description: "Upload an image file",
          contentType: "multipart/form-data",
          body: {
            file: { type: "File", required: true, description: "Image file to upload" },
            albumId: { type: "string", description: "Album to add image to" },
            driveType: { type: "string", options: ["public", "private"], default: "public" }
          }
        },
        url: {
          method: "POST",
          path: "/upload/url",
          description: "Upload image from external URL",
          body: {
            url: { type: "string", required: true, description: "URL of image to import" },
            filename: { type: "string", description: "Custom filename (optional)" }
          }
        }
      },
      random: {
        get: {
          method: "GET",
          path: "/random",
          description: "Get random image(s) from the gallery",
          parameters: {
            count: { type: "number", default: 1, max: 10, description: "Number of random images" },
            format: { type: "string", options: ["json", "redirect", "url"], default: "json" }
          }
        }
      },
      search: {
        query: {
          method: "GET",
          path: "/search",
          description: "Advanced search with multiple filters",
          parameters: {
            q: { type: "string", required: true, description: "Search query" },
            type: { type: "string", options: ["all", "image", "gif", "svg"], default: "all" },
            sort: { type: "string", options: ["relevance", "newest", "oldest", "largest", "smallest"] },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20, max: 100 },
            minSize: { type: "number", description: "Minimum file size in bytes" },
            maxSize: { type: "number", description: "Maximum file size in bytes" },
            from: { type: "string", format: "date", description: "Upload date from (YYYY-MM-DD)" },
            to: { type: "string", format: "date", description: "Upload date to (YYYY-MM-DD)" }
          }
        }
      },
      qr: {
        generate: {
          method: "GET",
          path: "/qr",
          description: "Generate QR code for an image",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            type: { type: "string", options: ["view", "embed", "raw", "direct"], default: "view", description: "Link type for QR" },
            size: { type: "number", default: 200, max: 500, description: "QR code size in pixels" },
            format: { type: "string", options: ["svg", "png"], default: "svg" },
            fg: { type: "string", default: "000000", description: "Foreground color (hex without #)" },
            bg: { type: "string", default: "FFFFFF", description: "Background color (hex without #)" },
            error: { type: "string", options: ["L", "M", "Q", "H"], default: "M", description: "Error correction level" },
            margin: { type: "number", default: 2, description: "Margin around QR code" }
          }
        }
      },
      embed: {
        codes: {
          method: "GET",
          path: "/embed",
          description: "Get embed codes for an image in various formats",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            style: { type: "string", options: ["default", "minimal", "card"], default: "default" },
            theme: { type: "string", options: ["dark", "light"], default: "dark" },
            info: { type: "boolean", default: true, description: "Show image info" },
            width: { type: "string", default: "100%", description: "Embed width" },
            height: { type: "string", default: "auto", description: "Embed height" }
          },
          response: {
            embedCodes: {
              html: "<img src='...' />",
              markdown: "![...](url)",
              bbcode: "[img]url[/img]",
              iframe: "<iframe src='...' />",
              directLink: "https://...",
              viewerLink: "https://...",
              thumbnailHtml: "<a href='...'><img /></a>"
            }
          }
        }
      },
      shortlink: {
        get: {
          method: "GET",
          path: "/shortlink",
          description: "Get all link variations for an image",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            format: { type: "string", options: ["json", "text", "redirect"], default: "json" }
          }
        },
        create: {
          method: "POST",
          path: "/shortlink",
          description: "Parse and extract short link from URL",
          body: {
            url: { type: "string", required: true, description: "AniPic URL to parse" }
          }
        }
      },
      metadata: {
        get: {
          method: "GET",
          path: "/metadata",
          description: "Get comprehensive metadata for an image",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            format: { type: "string", options: ["json", "opengraph", "twitter"], default: "json" }
          },
          response: {
            basic: { imageId: "", filename: "", mimeType: "", size: 0, dimensions: "", uploadedAt: "", uploader: "" },
            technical: { repository: "", rawUrl: "", cdnProvider: "", cacheControl: "", contentType: "" },
            links: { view: "", embed: "", raw: "", api: "" },
            openGraph: { title: "", description: "", image: "", url: "", type: "" },
            twitter: { card: "", title: "", description: "", image: "" }
          }
        }
      },
      tags: {
        list: {
          method: "GET",
          path: "/tags",
          description: "Get all tags with counts",
          response: {
            tags: [{ name: "png", count: 100 }],
            categories: { byFormat: [], bySize: [] }
          }
        },
        filter: {
          method: "GET",
          path: "/tags?tag=:tag",
          description: "Get images by tag",
          parameters: {
            tag: { type: "string", required: true, description: "Tag to filter by (e.g., png, jpg, small, large)" },
            page: { type: "number", default: 1 },
            limit: { type: "number", default: 20, max: 100 }
          }
        }
      },
      resize: {
        get: {
          method: "GET",
          path: "/resize",
          description: "Get resize information for an image",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            w: { type: "number", description: "Target width" },
            h: { type: "number", description: "Target height" },
            q: { type: "number", default: 80, description: "Quality (1-100)" },
            f: { type: "string", options: ["auto", "webp", "png", "jpg"], description: "Output format" }
          }
        }
      },
      transform: {
        get: {
          method: "GET",
          path: "/transform",
          description: "Get CSS filter values for image transformations",
          parameters: {
            id: { type: "string", required: true, description: "Image ID" },
            rotate: { type: "number", description: "Rotation in degrees" },
            flip: { type: "string", options: ["horizontal", "vertical"], description: "Flip direction" },
            blur: { type: "number", description: "Blur amount in pixels" },
            grayscale: { type: "number", description: "Grayscale percentage (0-100)" },
            sepia: { type: "number", description: "Sepia percentage (0-100)" },
            brightness: { type: "number", description: "Brightness percentage" },
            contrast: { type: "number", description: "Contrast percentage" },
            saturation: { type: "number", description: "Saturation percentage" }
          }
        }
      },
      stats: {
        get: {
          method: "GET",
          path: "/stats",
          description: "Get platform-wide statistics",
          response: {
            overview: { totalImages: 1000, totalSize: 500000000, avgSize: 500000 },
            uploads: { today: 10, thisWeek: 50, thisMonth: 200 },
            breakdown: { byType: {}, bySize: {} }
          }
        }
      },
      storage: {
        stats: {
          method: "GET",
          path: "/storage",
          description: "Get storage usage statistics",
          response: {
            totalUsed: 500000000,
            percentUsed: 50,
            repos: [{ name: "repo-1", size: 100000000 }]
          }
        }
      },
      bulk: {
        operations: {
          method: "POST",
          path: "/bulk",
          auth: true,
          description: "Perform bulk operations on multiple images",
          body: {
            action: { type: "string", required: true, options: ["get", "delete", "info"] },
            imageIds: { type: "array", required: true, maxItems: 50, description: "Array of image IDs" }
          }
        }
      },
      albums: {
        list: {
          method: "GET",
          path: "/albums",
          description: "List all albums"
        },
        create: {
          method: "POST",
          path: "/albums",
          description: "Create a new album",
          body: { name: { type: "string", required: true } }
        }
      },
      user: {
        vault: {
          method: "GET",
          path: "/user/vault",
          auth: true,
          description: "Get user's private vault info and settings"
        },
        images: {
          method: "GET",
          path: "/user/images",
          auth: true,
          description: "Get user's uploaded images (both public and private)"
        }
      },
      health: {
        check: {
          method: "GET",
          path: "/health",
          description: "Check API health status"
        }
      },
      oembed: {
        get: {
          method: "GET",
          path: "/oembed",
          description: "Get oEmbed data for rich embeds",
          parameters: {
            url: { type: "string", required: true, description: "AniPic image URL" },
            format: { type: "string", options: ["json", "xml"], default: "json" }
          }
        }
      }
    },
    rateLimits: {
      default: "1000 requests/hour",
      upload: "100 uploads/hour",
      bulk: "50 operations/request",
      search: "500 searches/hour"
    },
    errors: {
      400: { code: "BAD_REQUEST", message: "Invalid parameters or request body" },
      401: { code: "UNAUTHORIZED", message: "Authentication required or invalid token" },
      403: { code: "FORBIDDEN", message: "You don't have permission to access this resource" },
      404: { code: "NOT_FOUND", message: "Resource doesn't exist" },
      429: { code: "RATE_LIMITED", message: "Too many requests, please slow down" },
      500: { code: "INTERNAL_ERROR", message: "Something went wrong on our end" }
    },
    sdks: {
      note: "Official SDKs coming soon. Use any HTTP client to interact with the API.",
      examples: {
        curl: "curl -X GET https://api.anipic.com/api/v1/images",
        javascript: "fetch('/api/v1/images').then(r => r.json())",
        python: "requests.get('https://api.anipic.com/api/v1/images')"
      }
    }
  };

  return NextResponse.json(docs, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    }
  });
}
