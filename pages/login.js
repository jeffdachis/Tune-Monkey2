import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage("Login failed.");
    } else {
      setMessage("Check your email for the login link.");
    }
  };

  return (
    <main>
      <h1>Login</h1>
      <input type="email" placeholder="Your email" onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleLogin}>Send Magic Link</button>
      <p>{message}</p>
    </main>
  );
}