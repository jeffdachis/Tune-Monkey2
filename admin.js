import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UT_API_KEY } from '../uploadthing.config';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [delivered, setDelivered] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    };
    fetchRequests();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file || !selectedRequestId) return alert("Missing file or request ID");

    const res = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: file.name, type: file.type }),
    });
    const { url } = await res.json();
    await fetch(url, { method: "PUT", body: file });
    const fileUrl = url.split("?")[0];
    setUploadUrl(fileUrl);
  };

  const sendFile = async () => {
    if (!uploadUrl || !selectedRequestId) return;

    const { error } = await supabase
      .from('custom_requests')
      .update({ downloadUrl: uploadUrl, status: 'delivered' })
      .eq('id', selectedRequestId);

    if (!error) {
      setDelivered(true);
    } else {
      alert("Error delivering file");
    }
  };

  return (
    <main>
      <h1>Admin Panel</h1>
      <h2>Pending Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req.id}>
            <strong>{req.email}</strong> → {req.tune_type} / {req.battery} / {req.motor}
            <button onClick={() => setSelectedRequestId(req.id)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequestId && (
        <>
          <h3>Upload Tune for Request ID: {selectedRequestId}</h3>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={uploadFile}>Upload</button>
          {uploadUrl && <p>Uploaded to: {uploadUrl}</p>}
          {uploadUrl && !delivered && <button onClick={sendFile}>Send File to User</button>}
          {delivered && <p>✅ Delivered!</p>}
        </>
      )}
    </main>
  );
}