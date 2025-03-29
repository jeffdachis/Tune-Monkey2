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
        .select('id, motor, controller, status, uploadUrl, file_type, file_size')
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
                <>
                  <a href={r.uploadUrl} target="_blank" rel="noopener noreferrer">
                    ⬇️ Download Tune
                  </a><br />
                  Type: {r.file_type || 'Unknown'}<br />
                  Size: {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
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
