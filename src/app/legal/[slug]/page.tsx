import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  isLegalSlug,
  LEGAL_DOCUMENTS,
  LEGAL_DOCUMENTS_BY_SLUG
} from '@/data/legal';
import { LegalDocumentView } from '@/views/LegalDocumentView';

interface LegalSlugPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export function generateMetadata({ params }: LegalSlugPageProps): Metadata {
  if (!isLegalSlug(params.slug)) {
    return {
      title: 'Legal // TrialN1'
    };
  }
  const doc = LEGAL_DOCUMENTS_BY_SLUG[params.slug];
  return {
    title: `${doc.title} // TrialN1`,
    description: doc.subtitle
  };
}

export default function LegalSlugPage({ params }: LegalSlugPageProps) {
  if (!isLegalSlug(params.slug)) {
    notFound();
  }

  return <LegalDocumentView document={LEGAL_DOCUMENTS_BY_SLUG[params.slug]} />;
}
