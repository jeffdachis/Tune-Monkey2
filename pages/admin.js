// pages/admin.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not found');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        console.error('Access denied. Not an admin.');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data: allRequests, error: requestsError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error loading requests:', requestsError);
      } else {
        setRequests(allRequests);
      }

      setLoading(false);
    };

    fetchRequests();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!isAdmin) return <p>Access denied.</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <strong>{r.email}</strong> — {r.motor} / {r.controller}<br />
            Status: <strong>{r.status}</strong><br />
            Submitted by: <small>{r.user_id}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
