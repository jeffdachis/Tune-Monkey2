import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndRequests = async () => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not authenticated");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading requests:", error);
      } else {
        setRequests(data);
      }
    };

    fetchUserAndRequests();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Your Tune Requests</h1>

      {requests.length === 0 ? (
        <p>No tune requests yet.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.id} style={{ marginBottom: 20 }}>
              <strong>Motor:</strong> {req.motor} <br />
              <strong>Controller:</strong> {req.controller} <br />
              <strong>Status:</strong> {req.status} <br />
              {req.status === 'delivered' && req.uploadUrl ? (
                <a href={req.uploadUrl} download>
                  ⬇️ Download Tune File
                </a>
              ) : (
                <em>Tune not yet delivered.</em>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
