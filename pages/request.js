import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function RequestTune() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ motor: '', controller: '', notes: '' });
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profileData || !profileData.first_name || !profileData.last_name || !profileData.phone) {
        setBlocked(true);
      } else {
        setProfile({ ...profileData, email: user.email });
      }
    };

    checkProfile();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitRequest = async () => {
    if (!form.motor || !form.controller) {
      setStatus('Please fill in motor and controller.');
      return;
    }

    setSubmitting(true);
    setStatus('');

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('custom_requests').insert({
      ...form,
      user_id: user.id,
      email: profile.email,
      requester_name: `${profile.first_name} ${profile.last_name}`,
      status: 'pending'
    });

    setSubmitting(false);
    if (error) {
      console.error('Insert error:', error);
      setStatus('Error submitting request.');
    } else {
      setStatus('✅ Request submitted!');
      setForm({ motor: '', controller: '', notes: '' });
    }
  };

  if (blocked) {
    return (
      <main style={{ padding: 40 }}>
        <p style={{ color: 'red' }}>
          You must complete your profile before submitting a tune request.
        </p>
        <button onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Request a Custom Tune</h1>
      <label>Motor</label>
      <input value={form.motor} onChange={(e) => updateField('motor', e.target.value)} />
      <label>Controller</label>
      <input value={form.controller} onChange={(e) => updateField('controller', e.target.value)} />
      <label>Notes</label>
      <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
      <button onClick={submitRequest} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
      <p>{status}</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: 20 }}>⬅ Back to Dashboard</button>
    </main>
  );
}
