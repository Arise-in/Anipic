import { NextRequest, NextResponse } from "next/server";
import { getPublicImages, getStorageStats } from "@/lib/github";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const checks: { name: string; status: string; latency?: number; error?: string }[] = [];

    const githubStart = Date.now();
    try {
      const images = await getPublicImages();
      checks.push({
        name: "github_api",
        status: images ? "healthy" : "degraded",
        latency: Date.now() - githubStart
      });
    } catch (e) {
      checks.push({
        name: "github_api",
        status: "unhealthy",
        latency: Date.now() - githubStart,
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }

    const storageStart = Date.now();
    try {
      const stats = await getStorageStats();
      checks.push({
        name: "storage",
        status: stats ? "healthy" : "degraded",
        latency: Date.now() - storageStart
      });
    } catch (e) {
      checks.push({
        name: "storage",
        status: "unhealthy",
        latency: Date.now() - storageStart,
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }

    const allHealthy = checks.every(c => c.status === "healthy");
    const anyUnhealthy = checks.some(c => c.status === "unhealthy");

    const overallStatus = allHealthy ? "healthy" : anyUnhealthy ? "unhealthy" : "degraded";

    return NextResponse.json({
      status: overallStatus,
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks
    }, { 
      status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }, { status: 503 });
  }
}
