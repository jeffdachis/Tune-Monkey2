import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  // ✅ Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      }
    };

    checkSession();

    // Optional: listener for auth state change via magic link
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('Sending magic link...');

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setStatus('Login error: ' + error.message);
    } else {
      setStatus('Magic link sent. Check your email.');
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" style={{ marginTop: 10 }}>
          Send Magic Link
        </button>
      </form>
      <p>{status}</p>
    </main>
  );
}

