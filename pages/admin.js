import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAuthorized, setIsAuthorized] = useState(null); // null = loading, false = blocked

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAuthorized(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile || !profile.is_admin) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);

      const { data: allRequests, error: requestError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestError) {
        console.error('Error fetching requests:', requestError);
        return;
      }

      setRequests(allRequests);
    };

    fetchData();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || (r.status || 'pending') === statusFilter;
    const matchesSearch =
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.motor?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isAuthorized === null) return <p>Loading...</p>;
  if (isAuthorized === false) return <p style={{ padding: 40, fontWeight: 'bold' }}>Access Denied.</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Status Filter: </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
        </select>

        <input
          style={{ marginLeft: 20 }}
          type="text"
          placeholder="Search name/email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredRequests.length === 0 ? (
        <p>No matching requests.</p>
      ) : (
        <ul>
          {filteredRequests.map((r) => (
            <li key={r.id} style={{ marginBottom: 20 }}>
              <strong>{r.email}</strong> — {r.motor} / {r.controller}<br />
              Status: {r.status || 'pending'}<br />
              File: {r.downloadUrl ? (
                <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">Download</a>
              ) : (
                <em>Not uploaded</em>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

