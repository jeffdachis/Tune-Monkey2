import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function RequestTune() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    motor: '',
    controller: '',
    notes: ''
  });

  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setBlocked(true);
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

    const { error } = await supabase.from('custom_requests').insert([
      {
        user_id: user.id,
        email: profile.email,
        motor: form.motor,
        controller: form.controller,
        notes: form.notes,
        status: 'pending'
      }
    ]);

    if (error) {
      setStatus('❌ Request failed.');
    } else {
      setStatus('✅ Request submitted!');
      setForm({ motor: '', controller: '', notes: '' });
    }

    setSubmitting(false);
  };

  if (blocked) {
    return (
      <main style={{ padding: 20, maxWidth: 600 }}>
        <h1>Complete Profile First</h1>
        <p>You must complete your profile before requesting a tune.</p>
        <button onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 20, maxWidth: 600 }}>
      <h1>Request a Tune</h1>

      <label>Motor *</label>
      <input value={form.motor} onChange={(e) => updateField('motor', e.target.value)} placeholder="Motor Type / Power" />

      <label>Controller *</label>
      <input value={form.controller} onChange={(e) => updateField('controller', e.target.value)} placeholder="Stock or Aftermarket" />

      <label>Notes (optional)</label>
      <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={5} />

      <button onClick={submitRequest} disabled={submitting} style={{ marginTop: 20 }}>
        {submitting ? 'Submitting...' : 'Submit Request'}
      </button>

      {status && <p style={{ marginTop: 15 }}>{status}</p>}

      <p style={{ marginTop: 40 }}>
        <button onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
      </p>
    </main>
  );
}

