import type { Metadata } from 'next';
import { LegalCenter } from '@/views/LegalCenter';

export const metadata: Metadata = {
  title: 'Legal & Trust Center // TrialN1',
  description:
    'Privacy Policy, Terms & Conditions, Terms of Use, Medical & Research Disclaimer, Cookie Policy, and AI Transparency for TrialN1.'
};

export default function LegalCenterPage() {
  return <LegalCenter />;
}
