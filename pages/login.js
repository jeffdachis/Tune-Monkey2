import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Redirect to /dashboard if logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage('Error sending link.');
    } else {
      setMessage('Check your email for the login link.');
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 12 }}
        />
        <button type="submit">Send Magic Link</button>
      </form>
      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
