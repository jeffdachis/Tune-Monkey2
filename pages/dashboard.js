import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [request, setRequest] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email);
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setRequest(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Logged in as: {userEmail}</p>
      <h2>Your Custom Tune</h2>
      {request?.status === 'delivered' ? (
        <a href={request.downloadUrl} target="_blank" rel="noopener noreferrer">
          <button>Download Your Tune</button>
        </a>
      ) : (
        <p>Your file has not yet been delivered.</p>
      )}
    </main>
  );
}
