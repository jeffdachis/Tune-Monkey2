import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Not logged in');
        return;
      }

      // Check if current user is admin
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profileData?.is_admin) {
        alert('Access denied. Admins only.');
        return;
      }

      // Load all custom requests
      const { data: requestData, error: requestError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestError) {
        console.error('Error loading requests:', requestError);
        return;
      }

      setRequests(requestData);

      // Load all user profiles to cross-reference names/emails
      const { data: profileList, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email');

      if (profileError) {
        console.error('Error loading profiles:', profileError);
        return;
      }

      const profileMap = {};
      profileList.forEach((p) => {
        profileMap[p.user_id] = `${p.first_name || ''} ${p.last_name || ''} (${p.email || 'No Email'})`;
      });

      setProfiles(profileMap);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) return <p>Loading admin panel...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      {requests.length === 0 ? (
        <p>No tune requests found.</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id} style={{ marginBottom: 24 }}>
              <strong>{profiles[r.user_id] || r.user_id}</strong> — {r.motor} / {r.controller}
              <br />
              Status: <strong>{r.status || 'pending'}</strong>
              <br />
              Submitted: {r.created_at ? new Date(r.created_at).toLocaleString() : 'Unknown'}
              <br />
              {r.downloadUrl ? (
                <a
                  href={`${r.downloadUrl}?download=${r.id}.json`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'green', fontWeight: 'bold' }}
                >
                  ⬇️ Download Tune
                </a>
              ) : (
                <em style={{ color: 'gray' }}>Not delivered yet</em>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
