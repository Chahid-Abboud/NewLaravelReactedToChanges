import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

type Gender = '' | 'male' | 'female' | 'other';

type WizardForm = {
  first_name: string;
  last_name: string;
  gender: Gender;
  age: string;        // keep as string in the form; Laravel will validate numeric
  height_cm: string;  // same
  weight_kg: string;  // same
  dietary_goal: string;
  fitness_goal: string;
  diet_name: string;
  allergies: string[];
};

type Props = {
  dietOptions: string[];
  allergyOptions: string[];
  fitnessGoals: string[];
  dietaryGoals: string[];
  prefill?: Partial<WizardForm>;
};

export default function RegisterWizard({
  dietOptions,
  allergyOptions,
  fitnessGoals,
  dietaryGoals,
  prefill = {},
}: Props) {
  const [step, setStep] = useState(1);

  const { data, setData, post, processing, errors } = useForm<WizardForm>({
    first_name: prefill.first_name ?? '',
    last_name: prefill.last_name ?? '',
    gender: (prefill.gender as Gender) ?? '',
    age: prefill.age ?? '',
    height_cm: prefill.height_cm ?? '',
    weight_kg: prefill.weight_kg ?? '',
    dietary_goal: prefill.dietary_goal ?? '',
    fitness_goal: prefill.fitness_goal ?? '',
    diet_name: prefill.diet_name ?? '',
    allergies: prefill.allergies ?? [],
  });

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const saveAndContinue = () => post('/onboarding'); // server redirects to /register

  return (
    <>
      <Head title="Onboarding — Profile" />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Tell us about you</h1>

        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Basic info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">First name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={data.first_name}
                  onChange={(e) => setData('first_name', e.target.value)}
                />
                {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm">Last name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={data.last_name}
                  onChange={(e) => setData('last_name', e.target.value)}
                />
                {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
              </div>
              <div>
                <label className="block text-sm">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={data.gender}
                  onChange={(e) => setData('gender', e.target.value as Gender)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm">Age</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={data.age}
                  onChange={(e) => setData('age', e.target.value)}
                />
                {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-sm">Height (cm)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={data.height_cm}
                  onChange={(e) => setData('height_cm', e.target.value)}
                />
                {errors.height_cm && <p className="text-sm text-red-600">{errors.height_cm}</p>}
              </div>
              <div>
                <label className="block text-sm">Weight (kg)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={data.weight_kg}
                  onChange={(e) => setData('weight_kg', e.target.value)}
                />
                {errors.weight_kg && <p className="text-sm text-red-600">{errors.weight_kg}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={next}>
                Next
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Goals & dietary</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Dietary Goal</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={data.dietary_goal}
                  onChange={(e) => setData('dietary_goal', e.target.value)}
                >
                  <option value="">Select</option>
                  {dietaryGoals.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.dietary_goal && <p className="text-sm text-red-600">{errors.dietary_goal}</p>}
              </div>
              <div>
                <label className="block text-sm">Fitness Goal</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={data.fitness_goal}
                  onChange={(e) => setData('fitness_goal', e.target.value)}
                >
                  <option value="">Select</option>
                  {fitnessGoals.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.fitness_goal && <p className="text-sm text-red-600">{errors.fitness_goal}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Diet</label>
                <input
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="e.g., Mediterranean, Keto, or Other"
                  value={data.diet_name}
                  onChange={(e) => setData('diet_name', e.target.value)}
                />
                {errors.diet_name && <p className="text-sm text-red-600">{errors.diet_name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Allergies</label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {allergyOptions.map((a) => {
                    const active = data.allergies.includes(a);
                    return (
                      <label
                        key={a}
                        className={`flex items-center gap-2 border rounded px-3 py-2 ${
                          active ? 'bg-gray-100' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => {
                            if (e.target.checked) setData('allergies', [...data.allergies, a]);
                            else setData('allergies', data.allergies.filter((x) => x !== a));
                          }}
                        />
                        <span>{a}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.allergies && <p className="text-sm text-red-600">{errors.allergies}</p>}
              </div>
            </div>

            <div className="flex justify-between">
              <button className="px-4 py-2 rounded border" onClick={back}>
                Back
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                disabled={processing}
                onClick={saveAndContinue}
              >
                Continue to account
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
