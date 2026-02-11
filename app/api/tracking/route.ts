import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import {
  getAllFileStats,
  getFileStats,
  deleteFileViews,
  deleteAllFileViews,
} from "@/lib/tracking";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json(
        { message: "Authentification requise.", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const filename = searchParams.get("filename");

    if (folder && filename) {
      const stats = getFileStats(folder, filename);
      return NextResponse.json(stats);
    }

    const allStats = getAllFileStats();
    return NextResponse.json({ files: allStats });
  } catch (e) {
    console.error("[OpenFiler] Tracking API error:", e);
    return NextResponse.json(
      {
        message: "Erreur lors de la récupération des statistiques de suivi.",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json(
        { message: "Authentification requise.", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const filename = searchParams.get("filename");

    let deleted: number;
    if (folder && filename) {
      deleted = deleteFileViews(folder, filename);
    } else {
      deleted = deleteAllFileViews();
    }

    return NextResponse.json({
      message: `${deleted} entrée(s) supprimée(s).`,
      deleted,
    });
  } catch (e) {
    console.error("[OpenFiler] Tracking delete error:", e);
    return NextResponse.json(
      {
        message: "Erreur lors de la suppression des logs.",
        error: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
