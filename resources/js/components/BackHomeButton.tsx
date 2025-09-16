import { Link } from "@inertiajs/react";

export default function BackHomeButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/home"
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 ${className}`}
    >
      <span aria-hidden>←</span> Back to Home
    </Link>
  );
}
