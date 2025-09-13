import { Head, useForm, Link } from '@inertiajs/react';
import { useEffect } from 'react';

type Props = {
  prefill?: Record<string, any>;
};

export default function Register({ prefill = {} }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  // just to demonstrate we can show who you are creating:
  const fullName = [prefill.first_name, prefill.last_name].filter(Boolean).join(' ');

  const submit = () => post('/register');

  return (
    <>
      <Head title="Register" />
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>

        {/* Summary from wizard */}
        <div className="p-4 border rounded bg-gray-50">
          <div className="text-sm text-gray-700">
            <div><strong>Name:</strong> {fullName || '—'}</div>
            <div><strong>Dietary goal:</strong> {prefill.dietary_goal || '—'}</div>
            <div><strong>Fitness goal:</strong> {prefill.fitness_goal || '—'}</div>
          </div>
          <div className="mt-2">
            <Link href="/onboarding" className="text-blue-600 underline">Edit profile</Link>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm">Username (optional)</label>
            <input className="w-full border rounded px-3 py-2"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)} />
            {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm">Email</label>
            <input className="w-full border rounded px-3 py-2"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)} />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)} />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm">Confirm Password</label>
            <input type="password" className="w-full border rounded px-3 py-2"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={processing}
            onClick={submit}
          >
            Create Account
          </button>
        </div>
      </div>
    </>
  );
}
