import { AuthView } from '@/views/AuthView';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return <AuthView mode="signup" />;
}
