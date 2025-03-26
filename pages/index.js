import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Tune Monkey</h1>
      <ul>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/request">Request a Tune</Link></li>
        <li><Link href="/admin">Admin Panel</Link></li>
      </ul>
    </main>
  );
}

