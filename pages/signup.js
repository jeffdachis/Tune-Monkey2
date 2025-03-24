import { useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMsg('Signup successful. You can now log in.');
    } catch (error) {
      setMsg('Signup failed: ' + error.message);
    }
  };

  return (
    <main>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /><br/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><br/>
        <button type="submit">Sign Up</button>
      </form>
      <p>{msg}</p>
      <a href="/login">Already have an account? Log in</a>
    </main>
  );
}