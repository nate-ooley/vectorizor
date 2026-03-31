import Link from 'next/link';
import SignupForm from '@/components/magic-wanda/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Magic Wanda</h1>
          <p className="text-neutral-400">Create your account</p>
        </div>
        <SignupForm />
        <p className="mt-4 text-sm text-neutral-500">
          Already have an account?{' '}
          <Link href="/magic-wanda/login" className="text-purple-400 hover:text-purple-300">
            Sign in
          </Link>
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-neutral-600 hover:text-neutral-400">
          &larr; Back to Portal
        </Link>
      </div>
    </div>
  );
}
