import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      setMsg('Login failed: ' + error.message);
    }
  };

  return (
    <main>
      <h1>Log In</h1>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /><br/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><br/>
        <button type="submit">Log In</button>
      </form>
      <p>{msg}</p>
      <a href="/signup">Need an account? Sign up</a>
    </main>
  );
}