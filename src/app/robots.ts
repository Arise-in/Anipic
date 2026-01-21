import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://anipic.aniflix.in";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/settings", "/dashboard"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
