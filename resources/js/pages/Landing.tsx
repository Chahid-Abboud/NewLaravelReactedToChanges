import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function Landing() {
  return (
    <>
      <Head title="Hayetak — Start" />
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Take control of your health with <span className="text-blue-600">Hayetak</span>
          </h1>
          <p className="text-gray-600">
            A smart nutrition & fitness tracker inspired by MyFitnessPal — with your own twists.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="/register"
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Start Your Journey
            </a>
            <Link
              href="/login"
              className="text-sm text-blue-600 underline"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export function ContinueAsGuestButton() {
  return <button onClick={() => router.post(('/guest.start'))}>Continue as Guest</button>;
}