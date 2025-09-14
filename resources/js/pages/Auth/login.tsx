import { Head, useForm, Link } from '@inertiajs/react';

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <>
      <Head title="Log in" />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
        <div className="w-full max-w-md bg-white shadow rounded p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center">Log in to Hayetak</h1>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
              />
              <label htmlFor="remember" className="text-sm">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              Log in
            </button>
          </form>

          <div className="text-center text-sm">
            <Link href="/onboarding" className="text-blue-600 underline">
              Don’t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
