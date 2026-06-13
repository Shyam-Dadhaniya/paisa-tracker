import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CloudUpload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/services/supabase';

export default function Login() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <main className="safe-top safe-bottom max-w-md mx-auto px-4">
        <p className="text-danger">Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.</p>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === 'signup') {
      setInfo('Account created. If email confirmation is on in your Supabase project, check your inbox. Otherwise you are signed in.');
      setTimeout(() => navigate('/'), 1200);
    } else {
      navigate('/');
    }
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted active:scale-95" aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Cloud sync</h1>
      </header>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-gradient flex items-center justify-center mb-3 shadow-soft">
          <CloudUpload size={30} className="text-white" />
        </div>
        <p className="text-sm text-muted leading-relaxed max-w-xs">
          Sign in to sync expenses across your iPhone, laptop, and any device. Protects against iOS data wipe.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
        />
        <input
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
        />

        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{error}</p>
        )}
        {info && (
          <p className="text-sm text-success bg-success/10 border border-success/30 rounded-xl px-3 py-2">{info}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gradient text-white font-semibold py-3.5 rounded-2xl shadow-soft active:scale-[0.98] transition disabled:opacity-50"
        >
          {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setInfo(null);
          }}
          className="w-full text-sm text-muted py-2"
        >
          {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
        </button>
      </form>
    </main>
  );
}
