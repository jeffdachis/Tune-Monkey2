import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UploadButton } from '@uploadthing/react';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);

  // FETCH CUSTOM REQUESTS
  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data);
      }
    };

    fetchRequests();
  }, []);

  const handleUploadComplete = async (res) => {
    if (!res || !res[0]) {
      console.error("Upload failed");
      return;
    }

    const { url } = res[0];

    const { error } = await supabase
      .from('custom_requests')
      .update({ uploadUrl: url, status: 'delivered' })
      .eq('id', selectedRequestId);

    if (error) {
      console.error("Error updating Supabase:", error);
    } else {
      setDelivered(true);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      <ul>
        {requests.map((req) => (
          <li key={req.id} style={{ marginBottom: 10 }}>
            <strong>ID:</strong> {req.id}<br />
            <strong>User:</strong> {req.email || req.user_id}<br />
            <strong>Motor:</strong> {req.motor} | <strong>Controller:</strong> {req.controller}<br />
            <strong>Status:</strong> {req.status}<br />
            <button onClick={() => setSelectedRequestId(req.id)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequestId && (
        <>
          <p>Selected Request: {selectedRequestId}</p>
          <UploadButton
            endpoint="uploadTune"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(e) => console.error('Upload error', e)}
          />
          {delivered && <p>✅ Delivered!</p>}
        </>
      )}
    </main>
  );
}
