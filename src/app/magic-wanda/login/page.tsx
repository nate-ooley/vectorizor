import Link from 'next/link';
import LoginForm from '@/components/magic-wanda/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Magic Wanda</h1>
          <p className="text-neutral-400">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link href="/magic-wanda/signup" className="text-purple-400 hover:text-purple-300">
            Sign up
          </Link>
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-neutral-600 hover:text-neutral-400">
          &larr; Back to Portal
        </Link>
      </div>
    </div>
  );
}
