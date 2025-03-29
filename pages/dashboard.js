import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndRequests = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return setLoading(false);

      setUserId(user.id);

      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setRequests(data);
      else console.error('Error fetching requests:', error);

      setLoading(false);
    };

    fetchUserAndRequests();

    const channel = supabase
      .channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_requests' },
        (payload) => {
          const updated = payload.new;
          if (updated.user_id === userId) {
            setRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return <p>Loading...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Your Tune Requests</h1>
      {requests.length === 0 ? (
        <p>No requests submitted yet.</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id} style={{ marginBottom: 20 }}>
              <strong>{r.motor} / {r.controller}</strong><br />
              Status: <strong>{r.status || 'pending'}</strong><br />
              {r.uploadUrl ? (
                <>
                  <a
                    href={r.uploadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ⬇️ Download Tune
                  </a>
                  <br />
                  <small>
                    {r.file_type ? `Type: ${r.file_type}` : ''}{" "}
                    {r.file_size ? `Size: ${(r.file_size / 1024).toFixed(1)} KB` : ''}
                  </small>
                </>
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

