import { getFirestore } from './guardrailLedger';
import { assertDurableWrite } from './persistence';
import {
  SUPPORTED_WIDGET_TYPES,
  type DataCollectionField,
  type ProposedWidgetSpec,
  type Routine,
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

/** Proposal ids are derived from the routine and field, never taken from model output. */
export function widgetProposalId(routineId: string, fieldId: string): string {
  return `widget_${routineId}_${fieldId}`.replace(/[^\w.-]/g, '_').slice(0, 200);
}

/**
 * Validates all fields in a routine's dataCollectionSpec without writing anything.
 * Unsupported or custom widgets get a safe fallback type and a proposal marked
 * `pending_review`. A proposal is only `approved` when an admin already approved that
 * exact id on the server; status values in model output are ignored.
 */
export async function validateRoutineWidgets(routine: Routine): Promise<Routine> {
  if (!routine.dataCollectionSpec || routine.dataCollectionSpec.length === 0) {
    return routine;
  }

  const validatedFields: DataCollectionField[] = [];

  for (const rawField of routine.dataCollectionSpec) {
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

    const proposalId = widgetProposalId(routine.id, rawField.id);
    const existing = await getWidgetProposal(proposalId);

    const proposal: ProposedWidgetSpec =
      existing?.status === 'approved'
        ? existing
        : {
            id: proposalId,
            requestedType,
            title: rawField.proposedWidget?.title || rawField.label || rawField.name,
            description:
              rawField.proposedWidget?.description ||
              rawField.instructions ||
              `Custom clinical endpoint widget for ${rawField.name}`,
            status: 'pending_review',
            routineId: routine.id,
            paperTitle: routine.paper?.title || routine.title,
            fieldId: rawField.id,
            unit: rawField.proposedWidget?.unit ?? rawField.unit,
            min: rawField.proposedWidget?.min ?? rawField.min,
            max: rawField.proposedWidget?.max ?? rawField.max,
            step: rawField.proposedWidget?.step ?? rawField.step,
            options: rawField.proposedWidget?.options ?? rawField.options,
            submittedAt: new Date().toISOString()
          };

    validatedFields.push({
      ...rawField,
      type: safeType,
      proposedWidget: proposal
    });
  }

  return {
    ...routine,
    dataCollectionSpec: validatedFields
  };
}

/** Puts a confirmed routine's pending widget proposals into the admin review queue. */
export async function registerRoutineWidgetProposals(routine: Routine): Promise<void> {
  for (const field of routine.dataCollectionSpec ?? []) {
    const proposal = field.proposedWidget;
    if (proposal && proposal.status !== 'approved') {
      await registerWidgetProposal({ ...proposal, status: 'pending_review' });
    }
  }
}

/** Validates widgets and immediately registers any pending proposals (used for confirmed routines). */
export async function validateAndRegisterRoutineWidgets(routine: Routine): Promise<Routine> {
  const validated = await validateRoutineWidgets(routine);
  await registerRoutineWidgetProposals(validated);
  return validated;
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

  const db = getFirestore();
  if (!db) {
    assertDurableWrite('Firestore widget registry');
  } else {
    try {
      await db
        .collection(WIDGET_PROPOSALS_COLLECTION)
        .doc(proposalId)
        .set(approved, { merge: true });
    } catch (err: unknown) {
      assertDurableWrite('Firestore widget registry', err);
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[WidgetRegistry] Could not update approved widget in Firestore:', message);
    }
  }

  memoryWidgetProposals.set(proposalId, approved);
  return approved;
}
