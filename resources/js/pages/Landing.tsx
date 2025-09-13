import { Head } from '@inertiajs/react';

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
            A smart nutrition & fitness tracker inspired by MyFitnessPal, but <strong>Better</strong>.
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Start Your Journey
          </a>
        </div>
      </main>
    </>
  );
}
