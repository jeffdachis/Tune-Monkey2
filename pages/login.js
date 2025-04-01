import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if user is already logged in and redirect
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard');
      }
    };

    checkSession();

    // Also listen for auth changes (magic link flow)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      alert('Error sending magic link: ' + error.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Login</h1>
      {submitted ? (
        <p>✅ Check your email for the magic link to log in.</p>
      ) : (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginRight: 10 }}
          />
          <button type="submit">Send Magic Link</button>
        </form>
      )}
    </main>
  );
}
