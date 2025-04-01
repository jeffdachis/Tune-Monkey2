import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
@@ -16,56 +20,130 @@ export default function Dashboard() {
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Insert blank profile if it doesn't exist
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert([{ user_id: user.id, email: user.email }])
          .select()
          .single();
        setProfile(newProfile);
      }

      // Load requests
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
    <main style={{ padding: 40, maxWidth: 700 }}>
      <h1>Dashboard</h1>

      <section style={{ marginBottom: 40 }}>
        <h2>Your Profile</h2>
        <label>First Name *</label>
        <input value={profile.first_name || ''} onChange={(e) => updateField('first_name', e.target.value)} />
        <label>Last Name *</label>
        <input value={profile.last_name || ''} onChange={(e) => updateField('last_name', e.target.value)} />
        <label>Mobile Phone *</label>
        <input value={profile.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
        <label>Email</label>
        <input value={profile.email || ''} readOnly />

        <h3>Bike Info (optional)</h3>
        <label>Bike Brand</label>
        <input value={profile.bike_brand || ''} onChange={(e) => updateField('bike_brand', e.target.value)} />
        <label>Bike Model</label>
        <input value={profile.bike_model || ''} onChange={(e) => updateField('bike_model', e.target.value)} />
        <label>Battery Size</label>
        <input value={profile.battery_size || ''} onChange={(e) => updateField('battery_size', e.target.value)} />
        <label>Motor Info</label>
        <input value={profile.motor_info || ''} onChange={(e) => updateField('motor_info', e.target.value)} />
        <label>Controller Type</label>
        <input value={profile.controller_type || ''} onChange={(e) => updateField('controller_type', e.target.value)} />
        <label>Wheel Size</label>
        <select value={profile.wheel_size || ''} onChange={(e) => updateField('wheel_size', e.target.value)}>
          <option value="">Select...</option>
          <option value="20">20"</option>
          <option value="24">24"</option>
          <option value="other">Other</option>
        </select>
        <label>Rider Weight (lbs)</label>
        <input value={profile.rider_weight || ''} onChange={(e) => updateField('rider_weight', e.target.value)} />

        <button onClick={saveProfile} disabled={saving} style={{ marginTop: 20 }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </section>

      <section>
        <h2>Your Tune Requests</h2>
        <button onClick={() => router.push('/request')} style={{ marginBottom: 20 }}>
          ➕ Request New Tune
        </button>

        {requests.length === 0 ? (
          <p>No requests submitted yet.</p>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.id} style={{ marginBottom: 24 }}>
                <strong>{r.motor} / {r.controller}</strong><br />
                Status: <strong>{r.status || 'pending'}</strong><br />
                File Type: {r.file_type || 'N/A'}<br />
                File Size: {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'N/A'}<br />
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
      </section>
    </main>
  );
}
