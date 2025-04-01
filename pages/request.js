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
      data: {
