import { Head, Link, usePage, router } from "@inertiajs/react";
import BmiCard from "@/components/BmiCard";
import WaterCard from "@/components/WaterCard";

// ---------- Types ----------
type AuthUser = {
  id: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  email: string;
} | null;

// Allow strings too, in case backend sends them as strings
type UserProfile =
  | {
      age: number | string | null;
      height_cm: number | string | null;
      weight_kg: number | string | null;
    }
  | null;

type WaterState = {
  today_ml: number;
  target_ml: number;
};

type HomeProps = {
  auth: { user: AuthUser };       // <-- comes from HandleInertiaRequests@share
  isGuest?: boolean;              // optional; we’ll infer if missing
  userProfile: UserProfile;       // height/weight for BMI
  water?: WaterState;             // provided by controller (today/target)
};

export default function Home() {
  const { auth, isGuest: isGuestProp, userProfile, water } = usePage<HomeProps>().props;

  // prefer server flag, otherwise infer from auth.user
  const isGuest = typeof isGuestProp === "boolean" ? isGuestProp : !auth?.user;

  // Greeting name priority: first_name → username → name → fallback
  const displayName =
    auth?.user?.first_name ||
    auth?.user?.username ||
    auth?.user?.name ||
    (isGuest ? "guest" : "there");

  // --- BMI: coerce to numbers & validate > 0 ---
  const hRaw = userProfile?.height_cm;
  const wRaw = userProfile?.weight_kg;

  const heightNum =
    typeof hRaw === "string" ? Number(hRaw) : typeof hRaw === "number" ? hRaw : undefined;
  const weightNum =
    typeof wRaw === "string" ? Number(wRaw) : typeof wRaw === "number" ? wRaw : undefined;

  const profileSafe =
    typeof heightNum === "number" &&
    isFinite(heightNum) &&
    heightNum > 0 &&
    typeof weightNum === "number" &&
    isFinite(weightNum) &&
    weightNum > 0
      ? {
          height_cm: heightNum,
          weight_kg: weightNum,
        }
      : undefined;

  return (
    <>
      <Head title="Home" />

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="font-semibold">
            <span className="text-gray-900">Hayetak</span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/nearby"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Explore
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              View Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* Page heading */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Hayetak, {displayName}
          </h1>
          <p className="text-gray-600">
            {isGuest ? "You are browsing as a guest." : "Here’s your personalized dashboard."}
          </p>
        </section>

        {/* Health cards row */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BMI */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">BMI</h2>
              </div>
              <BmiCard isGuest={isGuest} profile={profileSafe} />
            </div>

            {/* Water */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Water Intake</h2>
              </div>
              {/* Pass computed water state if present; WaterCard shows progress & +250/+500/+750 */}
              <WaterCard
                isGuest={isGuest}
                water={water ?? { today_ml: 0, target_ml: 2000 }}
                onQuickAdd={(ml: number) => router.post("/water", { ml }, { preserveScroll: true })}
              />
            </div>
          </div>
        </section>

        {/* Track Meals */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Track Meals</h2>
              <p className="text-gray-600">
                Log your breakfast, lunch, dinner, and snacks. We’ll total your macros and calories.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.visit("/meals")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Open Meal Tracker
              </button>
              <button
                onClick={() => router.visit("/meals/new")}
                className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
              >
                Quick Add
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Recent meals will appear here…
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Add food from templates…
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Scan barcode (future)…
            </div>
          </div>
        </section>

        {/* Log Workout */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Log Workout</h2>
              <p className="text-gray-600">
                Record strength and cardio. Track sets, reps, duration, and estimated calories.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.visit("/workouts")}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Open Workout Log
              </button>
              <button
                onClick={() => router.visit("/workouts/new")}
                className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100"
              >
                Quick Add
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Recent workouts will appear here…
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Start from a preset plan…
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-500">
              Import from wearable (future)…
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
