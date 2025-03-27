import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setMessage("Login failed.");
    } else {
      setMessage("Check your email for the login link.");
    }
  };

  return (
    <main>
      <h1>fLogin</h1>
      <input type="email" placeholder="Your email" onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleLogin}>Send Magic Link</button>
      <p>{message}</p>
    </main>
  );
}
