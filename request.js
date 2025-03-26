import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function RequestForm() {
  const [form, setForm] = useState({
    battery: '',
    motor: '',
    controller: '',
    tune_type: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('custom_requests').insert([{
      ...form,
      user_id: user.id,
      email: user.email,
      status: 'pending'
    }]);

    if (error) {
      console.error('Insert error:', error.message);
      setErrorMessage('Error submitting request: ' + error.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <main>
      <h1>Request a Custom Tune</h1>
      {submitted ? (
        <p>✅ Request submitted!</p>
      ) : (
        <>
          <input name="battery" placeholder="Battery" onChange={handleChange} /><br />
          <input name="motor" placeholder="Motor" onChange={handleChange} /><br />
          <input name="controller" placeholder="Controller" onChange={handleChange} /><br />
          <input name="tune_type" placeholder="Tune Type" onChange={handleChange} /><br />
          <textarea name="notes" placeholder="Additional Notes" onChange={handleChange} /><br />
          <button onClick={handleSubmit}>Submit Request</button>
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </>
      )}
    </main>
  );
}
