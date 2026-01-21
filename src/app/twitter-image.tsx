import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AniPic - Free Unlimited Image CDN & Hosting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#030304",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255, 0, 64, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              background: "linear-gradient(135deg, #ff0040 0%, #ff4080 100%)",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
              boxShadow: "0 25px 50px -12px rgba(255, 0, 64, 0.4)",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-2px",
                lineHeight: 1,
              }}
            >
              AniPic
            </span>
            <span
              style={{
                fontSize: 24,
                color: "rgba(255, 255, 255, 0.6)",
                marginTop: 8,
              }}
            >
              by Aniflix
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <span
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            Free Unlimited Image CDN & Hosting
          </span>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 32,
            }}
          >
            {["Lightning Fast", "Unlimited Storage", "Free Forever"].map(
              (text) => (
                <span
                  key={text}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 12,
                    fontSize: 18,
                    color: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {text}
                </span>
              )
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            anipic.aniflix.in
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
