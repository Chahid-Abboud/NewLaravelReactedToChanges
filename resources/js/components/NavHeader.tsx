// resources/js/components/NavHeader.tsx
import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function NavHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-[#FDF0D5]/90 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <Link href="/home" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-xl border border-[#1C2C64]/20" aria-hidden />
            <span className="text-lg font-semibold text-[#1C2C64]">Hayetak</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link className="text-sm font-medium text-[#1C2C64]" href="/home">Home</Link>
            <Link className="text-sm text-[#1C2C64]/80 hover:text-[#1C2C64]" href="/meal-tracker">Meal Tracker</Link>
            <Link className="text-sm text-[#1C2C64]/80 hover:text-[#1C2C64]" href="/workouts">Workout Log</Link>
            <Link className="text-sm text-[#1C2C64]/80 hover:text-[#1C2C64]" href="/nearby">Nearby</Link>
            <Link className="text-sm text-[#1C2C64]/80 hover:text-[#1C2C64]" href="/profile">Profile</Link>

            <form method="post" action="/logout">
              <input
                type="hidden"
                name="_token"
                value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ""}
              />
              <button
                type="submit"
                className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64] hover:bg-[#1C2C64]/5"
              >
                Logout
              </button>
            </form>
          </nav>

          {/* Mobile menu button */}
          <button
            className="inline-flex items-center justify-center rounded-lg border border-[#1C2C64]/20 px-2 py-1 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="i-ci-menu h-5 w-5" aria-hidden />
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="border-t bg-[#FDF0D5] md:hidden">
          <nav className="mx-auto grid max-w-5xl gap-1 px-4 py-2">
            <Link className="rounded-lg px-3 py-2 text-[#1C2C64]" href="/home">Home</Link>
            <Link className="rounded-lg px-3 py-2 text-[#1C2C64]" href="/meal-tracker">Meal Tracker</Link>
            <Link className="rounded-lg px-3 py-2 text-[#1C2C64]" href="/workouts">Workout Log</Link>
            <Link className="rounded-lg px-3 py-2 text-[#1C2C64]" href="/nearby">Nearby</Link>
            <Link className="rounded-lg px-3 py-2 text-[#1C2C64]" href="/settings/profile">Profile</Link>

            <form method="post" action="/logout" className="px-3 py-2">
              <input
                type="hidden"
                name="_token"
                value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ""}
              />
              <button
                type="submit"
                className="w-full rounded-lg border border-[#1C2C64]/20 px-3 py-2 text-left text-[#1C2C64]"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
