import { getFirestore } from './guardrailLedger';
import {
  SUPPORTED_WIDGET_TYPES,
  type DataCollectionField,
  type ProposedWidgetSpec,
  type Protocol,
  type WidgetType
} from '../types/routine';

const WIDGET_PROPOSALS_COLLECTION = 'widget_proposals';

// Hot in-memory store for offline/demo fail-safe and fast reads
const memoryWidgetProposals = new Map<string, ProposedWidgetSpec>();

export function isSupportedWidgetType(type: unknown): type is WidgetType {
  return (
    typeof type === 'string' &&
    (SUPPORTED_WIDGET_TYPES as readonly string[]).includes(type)
  );
}

export function inferFallbackWidgetType(
  requestedType: string,
  field: Partial<DataCollectionField>
): WidgetType {
  const lower = requestedType.toLowerCase();
  if (field.options && field.options.length > 0) {
    return 'multichoice';
  }
  if (lower.includes('timer') || lower.includes('pacer') || lower.includes('cadence') || lower.includes('hold')) {
    return 'timer';
  }
  if (lower.includes('photo') || lower.includes('scan') || lower.includes('image')) {
    return 'photo';
  }
  if (lower.includes('bool') || lower.includes('binary') || lower.includes('toggle')) {
    return 'boolean';
  }
  if (field.unit || (typeof field.max === 'number' && field.max > 10)) {
    return 'numeric';
  }
  return 'scale';
}

export async function getWidgetProposal(proposalId: string): Promise<ProposedWidgetSpec | null> {
  if (memoryWidgetProposals.has(proposalId)) {
    return memoryWidgetProposals.get(proposalId)!;
  }

  const db = getFirestore();
  if (db) {
    try {
      const docSnap = await db.collection(WIDGET_PROPOSALS_COLLECTION).doc(proposalId).get();
      if (docSnap.exists) {
        const data = docSnap.data() as ProposedWidgetSpec;
        memoryWidgetProposals.set(proposalId, data);
        return data;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[WidgetRegistry] Firestore lookup failed, using memory:', message);
    }
  }

  return null;
}

export async function registerWidgetProposal(proposal: ProposedWidgetSpec): Promise<ProposedWidgetSpec> {
  const existing = await getWidgetProposal(proposal.id);
  if (existing) {
    if (existing.status === 'approved') {
      return existing;
    }
  }

  memoryWidgetProposals.set(proposal.id, proposal);

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(WIDGET_PROPOSALS_COLLECTION)
        .doc(proposal.id)
        .set(proposal, { merge: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[WidgetRegistry] Could not persist widget proposal to Firestore:', message);
    }
  }

  return proposal;
}

/**
 * Validates all fields in a protocol's dataCollectionSpec.
 * If a field requests an unsupported widget type or specifies a custom proposedWidget,
 * registers the proposal for human oversight while assigning a safe fallback WidgetType.
 */
export async function validateAndRegisterProtocolWidgets(protocol: Protocol): Promise<Protocol> {
  if (!protocol.dataCollectionSpec || protocol.dataCollectionSpec.length === 0) {
    return protocol;
  }

  const validatedFields: DataCollectionField[] = [];

  for (const rawField of protocol.dataCollectionSpec) {
    const rawType = String(rawField.type || 'scale');
    const isStandard = isSupportedWidgetType(rawType);
    const hasCustomProposal = !isStandard || Boolean(rawField.proposedWidget);

    if (!hasCustomProposal) {
      validatedFields.push(rawField);
      continue;
    }

    const requestedType = rawField.proposedWidget?.requestedType || rawType;
    const safeType: WidgetType = isStandard
      ? rawType
      : inferFallbackWidgetType(requestedType, rawField);

    const proposalId =
      rawField.proposedWidget?.id || `widget_${protocol.id}_${rawField.id}`;

    const initialProposal: ProposedWidgetSpec = {
      id: proposalId,
      requestedType,
      title: rawField.proposedWidget?.title || rawField.label || rawField.name,
      description:
        rawField.proposedWidget?.description ||
        rawField.instructions ||
        `Custom clinical endpoint widget for ${rawField.name}`,
      status: rawField.proposedWidget?.status === 'approved' ? 'approved' : 'pending_review',
      protocolId: protocol.id,
      paperTitle: protocol.paper?.title || protocol.title,
      fieldId: rawField.id,
      unit: rawField.proposedWidget?.unit ?? rawField.unit,
      min: rawField.proposedWidget?.min ?? rawField.min,
      max: rawField.proposedWidget?.max ?? rawField.max,
      step: rawField.proposedWidget?.step ?? rawField.step,
      options: rawField.proposedWidget?.options ?? rawField.options,
      submittedAt: rawField.proposedWidget?.submittedAt || new Date().toISOString(),
      approvedAt: rawField.proposedWidget?.approvedAt
    };

    const resolvedProposal = await registerWidgetProposal(initialProposal);

    validatedFields.push({
      ...rawField,
      type: safeType,
      proposedWidget: resolvedProposal
    });
  }

  return {
    ...protocol,
    dataCollectionSpec: validatedFields
  };
}

export async function listWidgetProposals(): Promise<ProposedWidgetSpec[]> {
  const merged = new Map<string, ProposedWidgetSpec>(memoryWidgetProposals);

  const db = getFirestore();
  if (db) {
    try {
      const snap = await db.collection(WIDGET_PROPOSALS_COLLECTION).limit(50).get();
      for (const doc of snap.docs) {
        const data = doc.data() as ProposedWidgetSpec;
        merged.set(doc.id, data);
        memoryWidgetProposals.set(doc.id, data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[WidgetRegistry] Could not list widget proposals from Firestore:', message);
    }
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending_review' ? -1 : 1;
    }
    return b.submittedAt.localeCompare(a.submittedAt);
  });
}

export async function approveWidgetProposal(
  proposalId: string
): Promise<ProposedWidgetSpec | null> {
  const existing = await getWidgetProposal(proposalId);
  if (!existing) {
    return null;
  }

  const approved: ProposedWidgetSpec = {
    ...existing,
    status: 'approved',
    approvedAt: new Date().toISOString()
  };

  memoryWidgetProposals.set(proposalId, approved);

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(WIDGET_PROPOSALS_COLLECTION)
        .doc(proposalId)
        .set(approved, { merge: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[WidgetRegistry] Could not update approved widget in Firestore:', message);
    }
  }

  return approved;
}
