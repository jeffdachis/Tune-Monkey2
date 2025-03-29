
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');

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
    setStatusMsg('Uploading...');

    const filePath = `${selectedRequest.id}/${file.name}`;
    const { data, error } = await supabase.storage.from('tunes').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.error('Upload error:', error);
      setStatusMsg('❌ Upload failed');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('tunes').getPublicUrl(filePath);

    const updateError = await supabase
      .from('custom_requests')
      .update({ uploadUrl: publicUrl, status: 'delivered' })
      .eq('id', selectedRequest.id);

    if (updateError.error) {
      console.error('Supabase update error:', updateError.error);
      setStatusMsg('❌ Supabase update failed');
      return;
    }

    setUploadedUrl(publicUrl);
    setStatusMsg('✅ Delivered!');
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            <strong>{r.email}</strong> — {r.motor} / {r.controller}<br />
            Status: {r.status}<br />
            <button onClick={() => setSelectedRequest(r)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequest && (
        <div style={{ marginTop: 20 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
          {uploadedUrl && (
            <p>✅ Uploaded URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">{uploadedUrl}</a></p>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
