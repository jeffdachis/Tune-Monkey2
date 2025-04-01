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
        router.push('/login');
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
      setStatus('❌ Please fill in motor and controller.');
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
        status: 'pending',
        requester_name: `${profile.first_name} ${profile.last_name}`
      }
    ]);

    if (error) {
      console.error('Insert error:', error);
      setStatus('❌ Failed to submit request.');
    } else {
      setStatus('✅ Request submitted!');
      setForm({ motor: '', controller: '', notes: '' });
      setTimeout(() => router.push('/dashboard'), 2000);
    }

    setSubmitting(false);
  };

  if (blocked) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Profile Incomplete</h1>
        <p>
          You must complete your profile first (first name, last name, and mobile number).
        </p>
        <button onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 600 }}>
      <h1>Request a New Tune</h1>
      <button onClick={() => router.push('/dashboard')} style={{ marginBottom: 20 }}>
        ← Back to Dashboard
      </button>

      <label>Motor *</label>
      <input
        value={form.motor}
        onChange={(e) => updateField('motor', e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <label>Controller *</label>
      <input
        value={form.controller}
        onChange={(e) => updateField('controller', e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <label>Notes</label>
      <textarea
        value={form.notes}
        onChange={(e) => updateField('notes', e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
        rows={4}
      />

      <button onClick={submitRequest} disabled={submitting} style={{ marginTop: 10 }}>
        {submitting ? 'Submitting...' : 'Submit Tune Request'}
      </button>

      {status && <p style={{ marginTop: 20 }}>{status}</p>}
    </main>
  );
}
