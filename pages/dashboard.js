import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = (await supabase.auth.getUser()).data.user;
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
      <h1>Your Custom Tune</h1>
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