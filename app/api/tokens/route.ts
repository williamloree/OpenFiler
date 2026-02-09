import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { db } from "@/lib/auth/server";
import { requireSession } from "@/lib/auth/require-session";

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const tokens = db
    .prepare("SELECT id, name, token, createdAt FROM api_token WHERE userId = ? ORDER BY createdAt DESC")
    .all(session.user.id) as Array<{ id: string; name: string; token: string; createdAt: string }>;

  const masked = tokens.map((t) => ({
    id: t.id,
    name: t.name,
    token: "••••••••" + t.token.slice(-8),
    createdAt: t.createdAt,
  }));

  return NextResponse.json({ tokens: masked });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "NAME_REQUIRED", message: "Le nom est requis." }, { status: 400 });
  }

  const id = randomUUID();
  const token = "ofk_" + randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();

  db.prepare("INSERT INTO api_token (id, name, token, userId, createdAt) VALUES (?, ?, ?, ?, ?)")
    .run(id, name, token, session.user.id, createdAt);

  return NextResponse.json({ id, name, token, createdAt }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  }

  const result = db
    .prepare("DELETE FROM api_token WHERE id = ? AND userId = ?")
    .run(id, session.user.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
