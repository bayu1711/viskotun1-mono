import { NextResponse } from 'next/server';
import type { Protocol, ProtocolRuntime } from '@/types/protocol';

interface UserSyncPayload {
  userId: string;
  activeProtocolId?: string;
  protocols: Protocol[];
  runtime: Record<string, ProtocolRuntime>;
}

// In-memory server-side user store (ready for Cloud Firestore / Cloud SQL persistence)
const userStorage = new Map<
  string,
  {
    activeProtocolId?: string;
    protocols: Protocol[];
    runtime: Record<string, ProtocolRuntime>;
    updatedAt: number;
  }
>();

export async function POST(request: Request) {
  try {
    const body: UserSyncPayload = await request.json();
    const { userId, activeProtocolId, protocols, runtime } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    userStorage.set(userId, {
      activeProtocolId,
      protocols: protocols || [],
      runtime: runtime || {},
      updatedAt: Date.now()
    });

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
      protocolCount: (protocols || []).length
    });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error during user sync' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = userStorage.get(userId);
    if (!data) {
      return NextResponse.json({
        found: false,
        protocols: [],
        runtime: {}
      });
    }

    return NextResponse.json({
      found: true,
      activeProtocolId: data.activeProtocolId,
      protocols: data.protocols,
      runtime: data.runtime,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error('User sync fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error fetching user sync' }, { status: 500 });
  }
}
