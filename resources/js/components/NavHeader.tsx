// resources/js/components/NavHeader.tsx
import { Link, router } from "@inertiajs/react";
import { useState } from "react";

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const doLogout = () => router.post("/logout");

  return (
    <header className="sticky top-0 z-30 border-b border-[#1C2C64]/20 bg-gradient-to-r from-[#1C2C64] to-teal-600 text-white shadow-md backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2">
            <span
              className="inline-block h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              aria-hidden
            >
              <span className="h-5 w-5 rounded-md bg-gradient-to-tr from-teal-400 to-emerald-400" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Hayetak
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {[
              { href: "/home", label: "Home" },
              { href: "/meal-tracker", label: "Meal Tracker" },
              { href: "/workouts/log", label: "Workout Log" },
              { href: "/nearby", label: "Nearby" },
              { href: "/profile", label: "Profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={doLogout}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              Logout
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="border-t border-white/20 bg-gradient-to-b from-[#1C2C64] to-teal-700 md:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3">
            {[
              { href: "/home", label: "Home" },
              { href: "/meal-tracker", label: "Meal Tracker" },
              { href: "/workouts/log", label: "Workout Log" },
              { href: "/nearby", label: "Nearby" },
              { href: "/settings/profile", label: "Profile" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-white/90 hover:bg-white/10 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={doLogout}
              className="w-full rounded-lg bg-red-500/20 px-3 py-2 text-left text-red-100 hover:bg-red-500/30 hover:text-white transition"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
