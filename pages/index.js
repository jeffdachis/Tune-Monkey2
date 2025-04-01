import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        // User is logged in → go to dashboard
        router.replace('/dashboard');
      }
    };

    checkSession();
  }, [router]);

  return (
    <main style={{ padding: 40 }}>
      <h1>Welcome to Tune Monkey</h1>
      <p>Please log in to access your dashboard.</p>
    </main>
  );
}
