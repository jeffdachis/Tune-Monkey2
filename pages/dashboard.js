import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [request, setRequest] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      setUserEmail(user.email);

      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setRequest(data);
      }
    };

    fetchData();
  }, []);

  if (!request) return <p>Loading...</p>;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Logged in as: {userEmail}</p>
      <h2>Your Custom Tune</h2>
      {request.status === 'delivered' ? (
        <a href={request.downloadUrl} target="_blank" rel="noopener noreferrer">
          <button>Download Your Tune</button>
        </a>
      ) : (
        <p>Your file has not yet been delivered.</p>
      )}
    </main>
  );
}