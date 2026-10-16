import { NextResponse } from 'next/server';
import type { Protocol, ProtocolRuntime } from '../../../../types/protocol';
import { getFirestore } from '../../../../server/guardrailLedger';
import { COPY } from '../../../../data/copy';

interface UserSyncPayload {
  userId: string;
  activeProtocolId?: string;
  protocols: Protocol[];
  runtime: Record<string, ProtocolRuntime>;
}

// In-memory server-side user store with fail-safe fallback
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
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const payload = {
      activeProtocolId,
      protocols: protocols || [],
      runtime: runtime || {},
      updatedAt: Date.now()
    };

    userStorage.set(userId, payload);

    const db = getFirestore();
    if (db) {
      try {
        await db.collection('users').doc(userId).set(payload, { merge: true });
      } catch (firestoreErr: any) {
        console.warn('[UserSyncRoute] Could not persist to Firestore, stored in memory cache:', firestoreErr?.message || firestoreErr);
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
      protocolCount: (protocols || []).length
    });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const db = getFirestore();
    if (db) {
      try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            return NextResponse.json({
              found: true,
              activeProtocolId: data.activeProtocolId,
              protocols: data.protocols,
              runtime: data.runtime,
              updatedAt: data.updatedAt
            });
          }
        }
      } catch (firestoreErr: any) {
        console.warn('[UserSyncRoute] Could not read from Firestore, falling back to memory cache:', firestoreErr?.message || firestoreErr);
      }
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
    return NextResponse.json({ error: COPY.api.userSync.fetchError }, { status: 500 });
  }
}
