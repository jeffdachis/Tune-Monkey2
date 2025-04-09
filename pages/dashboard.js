import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert([{ user_id: user.id, email: user.email }])
          .select()
          .single();
        setProfile(newProfile);
      }

      const { data: requestData } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (requestData) setRequests(requestData);
      setLoading(false);
    };

    init();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('user_id', profile.user_id);
    setSaving(false);
    if (error) alert('Failed to save profile');
  };

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <section>
        <h2>Your Profile</h2>
        <input placeholder="First Name" value={profile.first_name || ''} onChange={e => updateField('first_name', e.target.value)} />
        <input placeholder="Last Name" value={profile.last_name || ''} onChange={e => updateField('last_name', e.target.value)} />
        <input placeholder="Phone" value={profile.phone || ''} onChange={e => updateField('phone', e.target.value)} />
        <input placeholder="Email" value={profile.email || ''} readOnly />
        <button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </section>

      <section>
        <h2>Your Tune Requests</h2>
        <button onClick={() => router.push('/request')}>+ Request New Tune</button>
        <ul>
          {requests.map((r) => (
            <li key={r.id}>
              <strong>{r.motor} / {r.controller}</strong><br />
              Status: <strong>{r.status || 'pending'}</strong><br />
              File Type: {r.file_type || 'N/A'}<br />
              File Size: {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'N/A'}<br />
              {r.downloadUrl ? (
                <a href={`${r.downloadUrl}?download=${r.id}.json`} download target="_blank" rel="noreferrer">⬇️ Download Tune</a>
              ) : (
                <em>Not delivered yet</em>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
