import type { Metadata } from 'next';
import { AboutView } from '@/views/AboutView';

export const metadata: Metadata = {
  title: 'About Us // TrialN1',
  description:
    'The story of how TrialN1 came to be, our mission to turn peer-reviewed human clinical research into daily habits, and the builders behind it — Fazarath Fazal and Thoshi.'
};

export default function AboutPage() {
  return <AboutView />;
}
