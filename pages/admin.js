import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching requests:', error);
      else setRequests(data);
    };

    fetchRequests();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
  if (!file || !selectedRequest) return alert('Missing file or request');

  setStatusMsg('Uploading to Supabase...');

  const filePath = `${selectedRequest.id}/${file.name}`;

  const { data, error } = await supabase.storage
    .from('tunes')
    .upload(filePath, file, {
      upsert: true, // overwrites if exists
    });

  if (error) {
    console.error('Upload error:', error);
    setStatusMsg('❌ Upload failed');
    return;
  }

  // Optionally get a public URL
  const { data: urlData } = supabase.storage.from('tunes').getPublicUrl(filePath);
  const downloadUrl = urlData?.publicUrl;

  // Update Supabase record
  const { error: updateError } = await supabase
    .from('custom_requests')
    .update({
      uploadUrl: downloadUrl,
      status: 'delivered'
    })
    .eq('id', selectedRequest.id);

  if (updateError) {
    console.error('Supabase update error:', updateError);
    setStatusMsg('❌ Failed to update Supabase');
    return;
  }

  setStatusMsg('✅ Delivered!');
};

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            <strong>{r.email || 'No email'}</strong> — {r.motor} / {r.controller}
            <button style={{ marginLeft: 10 }} onClick={() => setSelectedRequest(r)}>
              Select
            </button>
          </li>
        ))}
      </ul>

      {selectedRequest && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: 10 }}>Upload</button>
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
