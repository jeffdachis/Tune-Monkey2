import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedRequestId) {
      alert("Missing file or request selection");
      return;
    }

    // Dummy response simulation
    const fileUrl = "https://uploadthing.com/dummy/" + encodeURIComponent(file.name);

    const { error } = await supabase
      .from('custom_requests')
      .update({
        uploadUrl: fileUrl,
        status: 'delivered'
      })
      .eq('id', selectedRequestId);

    if (error) {
      console.error("Supabase update error:", error);
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
            <strong>Status:</strong> {req.status}<br />
            <button onClick={() => setSelectedRequestId(req.id)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequestId && (
        <>
          <p>Selected Request ID: {selectedRequestId}</p>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
          {delivered && <p>✅ Delivered!</p>}
        </>
      )}
    </main>
  );
}
