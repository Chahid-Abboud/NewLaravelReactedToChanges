import { Head, Link } from "@inertiajs/react";

export default function Landing() {
  return (
    <>
      <Head title="Hayetak — Start" />
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6">
          {/* subtle overlay with sidebar-primary (navy/green highlight) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              maskImage:
                "radial-gradient(60% 60% at 50% 30%, #000, transparent)",
            }}
          >
            <div className="absolute -top-16 left-1/2 h-64 w-[60rem] -translate-x-1/2 rounded-full blur-3xl opacity-20 bg-sidebar-primary" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
            Fuel Your Body. <span className="text-secondary">Reach Your Goals.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Hayetak helps you track nutrition, workouts, and hydration with
            ease — designed for health and fitness.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href={("/register")}
              className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold shadow hover:opacity-90 transition"
            >
              Start Your Journey
            </Link>
            <Link
              href={("/login")}
              className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold shadow hover:opacity-90 transition"
            >
              Login
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
