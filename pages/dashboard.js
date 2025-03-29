import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data);
      }

      setLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel('custom_requests_dashboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_requests' },
        (payload) => {
          setRequests((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Your Tune Requests</h1>
      {requests.length === 0 ? (
        <p>No requests submitted yet.</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id} style={{ marginBottom: 16 }}>
              <strong>{r.motor} / {r.controller}</strong><br />
              Status: {r.status || 'pending'}<br />
              {r.uploadUrl ? (
                <a
                  href={r.uploadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ⬇️ Download Tune (.json)
                </a>
              ) : (
                <em>Not delivered yet</em>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
