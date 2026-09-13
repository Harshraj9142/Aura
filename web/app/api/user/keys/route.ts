import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "GOVERNMENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "GOVERNMENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name || "Default Key";

    // Generate a secure API Key
    const rawKey = crypto.randomBytes(32).toString("hex");
    const apiKey = `aura_live_${rawKey}`;

    // Store in DB
    const newKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name: name,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json({ key: newKey });
  } catch (error) {
    console.error("Error generating API key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "GOVERNMENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
    }

    await prisma.apiKey.delete({
      where: {
        id: keyId,
        userId: (session.user as any).id, // ensure they can only delete their own
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
