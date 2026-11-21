import { AuthView } from '@/views/AuthView';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <AuthView mode="login" />;
}
