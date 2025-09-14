import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
  dietOptions: string[];
  allergyOptions: string[];
  fitnessGoals: string[];
  dietaryGoals: string[];
};

export default function RegisterWizard({ dietOptions, allergyOptions, fitnessGoals, dietaryGoals }: Props) {
  const [step, setStep] = useState(1);

  const { data, setData, post, processing, errors } = useForm({
    first_name: '',
    last_name: '',
    username: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    age: '' as number | string,
    height_cm: '' as number | string,
    weight_kg: '' as number | string,

    dietary_goal: '',
    fitness_goal: '',
    diet_name: '',
    allergies: [] as string[],

    email: '',
    password: '',
    password_confirmation: '',
  });

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const submit = () => post('/register');

  return (
    <>
      <Head title="Create your account" />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Create your Hayetak account</h1>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 1: Basic */}
        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">First name</label>
                <input className="w-full border rounded px-3 py-2"
                  value={data.first_name}
                  onChange={(e) => setData('first_name', e.target.value)} />
                {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm">Last name</label>
                <input className="w-full border rounded px-3 py-2"
                  value={data.last_name}
                  onChange={(e) => setData('last_name', e.target.value)} />
                {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
              </div>
              <div>
                <label className="block text-sm">Username (optional, must be unique)</label>
                <input className="w-full border rounded px-3 py-2"
                  value={data.username}
                  onChange={(e) => setData('username', e.target.value)} />
                {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-sm">Gender</label>
                <select className="w-full border rounded px-3 py-2"
                  value={data.gender}
                  onChange={(e) => setData('gender', e.target.value as any)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm">Age</label>
                <input type="number" className="w-full border rounded px-3 py-2"
                  value={data.age}
                  onChange={(e) => setData('age', e.target.value)} />
                {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-sm">Height (cm)</label>
                <input type="number" className="w-full border rounded px-3 py-2"
                  value={data.height_cm}
                  onChange={(e) => setData('height_cm', e.target.value)} />
                {errors.height_cm && <p className="text-sm text-red-600">{errors.height_cm}</p>}
              </div>
              <div>
                <label className="block text-sm">Weight (kg)</label>
                <input type="number" className="w-full border rounded px-3 py-2"
                  value={data.weight_kg}
                  onChange={(e) => setData('weight_kg', e.target.value)} />
                {errors.weight_kg && <p className="text-sm text-red-600">{errors.weight_kg}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={next}>Next</button>
            </div>
          </section>
        )}

        {/* Step 2: Goals & Dietary */}
        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Goals & Dietary</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Dietary Goal</label>
                <select className="w-full border rounded px-3 py-2"
                  value={data.dietary_goal}
                  onChange={(e) => setData('dietary_goal', e.target.value)}>
                  <option value="">Select</option>
                  {dietaryGoals.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.dietary_goal && <p className="text-sm text-red-600">{errors.dietary_goal}</p>}
              </div>
              <div>
                <label className="block text-sm">Fitness Goal</label>
                <select className="w-full border rounded px-3 py-2"
                  value={data.fitness_goal}
                  onChange={(e) => setData('fitness_goal', e.target.value)}>
                  <option value="">Select</option>
                  {fitnessGoals.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {errors.fitness_goal && <p className="text-sm text-red-600">{errors.fitness_goal}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Diet</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dietOptions.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`px-3 py-1 rounded border ${data.diet_name === d ? 'bg-blue-600 text-white' : ''}`}
                      onClick={() => setData('diet_name', d)}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`px-3 py-1 rounded border ${data.diet_name === 'Other' ? 'bg-blue-600 text-white' : ''}`}
                    onClick={() => setData('diet_name', 'Other')}
                  >
                    Other
                  </button>
                </div>
                {data.diet_name === 'Other' && (
                  <input
                    placeholder="Type your diet name"
                    className="w-full border rounded px-3 py-2"
                    onChange={(e) => setData('diet_name', e.target.value)}
                  />
                )}
                {errors.diet_name && <p className="text-sm text-red-600">{errors.diet_name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Allergies (multi-select)</label>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {allergyOptions.map((a) => {
                    const active = data.allergies.includes(a);
                    return (
                      <label key={a} className={`flex items-center gap-2 border rounded px-3 py-2 ${active ? 'bg-gray-100' : ''}`}>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => {
                            if (e.target.checked) setData('allergies', [...data.allergies, a]);
                            else setData('allergies', data.allergies.filter(x => x !== a));
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
              <button className="px-4 py-2 rounded border" onClick={back}>Back</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={next}>Next</button>
            </div>
          </section>
        )}

        {/* Step 3: Credentials */}
        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Login Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm">Email</label>
                <input className="w-full border rounded px-3 py-2"
                  value={data.email} onChange={(e) => setData('email', e.target.value)} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm">Password</label>
                <input type="password" className="w-full border rounded px-3 py-2"
                  value={data.password} onChange={(e) => setData('password', e.target.value)} />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm">Confirm Password</label>
                <input type="password" className="w-full border rounded px-3 py-2"
                  value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-between">
              <button className="px-4 py-2 rounded border" onClick={back}>Back</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                disabled={processing}
                onClick={submit}
              >
                Create Account
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
