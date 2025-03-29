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
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'custom_requests',
        },
        (payload) => {
          setRequests((prev) =>
            prev.map((req) => (req.id === payload.new.id ? payload.new : req))
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
            <li key={r.id} style={{ marginBottom: 20 }}>
              <strong>{r.motor} / {r.controller}</strong><br />
              Status: {r.status || 'pending'}<br />
              File Type: {r.file_type || 'N/A'}<br />
              File Size: {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'N/A'}<br />
              {r.downloadUrl ? (
                <a
                  href={r.downloadUrl}
                  download
                  style={{ color: 'green', fontWeight: 'bold' }}
                >
                  ⬇️ Download Tune
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
