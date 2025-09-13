import { Head } from '@inertiajs/react';

export default function Home() {
  return (
    <>
      <Head title="Home" />
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Welcome to Hayetak 👋</h1>
        <p className="text-gray-600">This is your dashboard.</p>
      </div>
    </>
  );
}
