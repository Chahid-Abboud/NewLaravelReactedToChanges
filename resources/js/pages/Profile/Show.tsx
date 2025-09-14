import { Head, Link, usePage } from "@inertiajs/react";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

type Prefs = {
  dietary_goal: string | null;
  fitness_goals: string[]; // can be empty
  diet_type: string | null;
  diet_other: string | null;
  allergies: string[];
};

type PageProps = {
  displayName: string;
  userProfile: UserProfile;
  prefs: Prefs | null;
  dietName: string;
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
    {children}
  </span>
);

export default function ProfileShow() {
  const { displayName, userProfile, prefs, dietName } = usePage<PageProps>().props;

  return (
    <>
      <Head title="Home — Hayetak" />
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <Link href="/" className="font-semibold">
              Hayetak
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
          {/* Welcome / actions */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">
              Welcome {displayName} , this is your profile
            </h2>
            <p className="text-sm text-gray-500">You’re all set. Choose what to do next.</p>
          </section>

          {/* Profile snapshot */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Your profile snapshot</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div>
                  {(userProfile.first_name ?? "") + " " + (userProfile.last_name ?? "")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Username</div>
                <div>{userProfile.username || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Gender</div>
                <div>{userProfile.gender || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Age</div>
                <div>{typeof userProfile.age === "number" ? userProfile.age : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Height</div>
                <div>
                  {typeof userProfile.height_cm === "number" ? `${userProfile.height_cm} cm` : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Weight</div>
                <div>
                  {typeof userProfile.weight_kg === "number" ? `${userProfile.weight_kg} kg` : "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Goals & prefs */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Your goals and preferences</h3>

            {prefs ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-gray-500">Dietary goal</div>
                  <div>{prefs.dietary_goal || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Diet type</div>
                  <div>{dietName || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fitness goals</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prefs.fitness_goals && prefs.fitness_goals.length > 0
                      ? prefs.fitness_goals.map((fg, i) => <Badge key={i}>{fg}</Badge>)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Allergies</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prefs.allergies && prefs.allergies.length > 0
                      ? prefs.allergies.map((al, i) => <Badge key={i}>{al}</Badge>)
                      : "—"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No preferences saved yet.</p>
            )}
          </section>
        </main>

        <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
          Data is read from your database via Laravel. React escapes output by default.
        </footer>
      </div>
    </>
  );
}
