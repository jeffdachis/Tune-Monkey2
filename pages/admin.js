import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadFiles } from '../lib/uploadthingClient'; // ✅ correct source

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

    try {
      const res = await uploadFiles("uploadTune", { files: [file] });

      if (!res || !res[0] || !res[0].url) {
        throw new Error("Upload failed");
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

    } catch (err) {
      console.error("Upload error:", err);
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
