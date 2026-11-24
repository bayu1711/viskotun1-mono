import type { Metadata } from 'next';
import { AdminDashboard } from '@/views/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Console // TrialN1',
  description:
    'Clinical Governance Console for managing TrialN1 guardrails, Scientific Gatekeeper rules, AI widget approvals, and system telemetry.'
};

export default function AdminPage() {
  return <AdminDashboard />;
}
