import type { Metadata } from 'next';
import { UaeLandingView } from '@/views/UaeLanding';
import { COPY } from '@/data/copy';

export const metadata: Metadata = {
  title: COPY.uaeLanding.meta.title,
  description: COPY.uaeLanding.meta.description
};

export default function UaePage() {
  return <UaeLandingView />;
}
