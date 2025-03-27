import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase.from('custom_requests').select('*').order('created_at', { ascending: false });
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

    const apiKey = process.env.NEXT_PUBLIC_UPLOADTHING_API_KEY;
    if (!apiKey) {
      setStatusMsg('❌ API key missing');
      return;
    }

    try {
      // Step 1: Get upload URL
      const res1 = await fetch('https://uploadthing.com/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-uploadthing-api-key': apiKey
        },
        body: JSON.stringify({
          files: [{ name: file.name, type: file.type }],
          metadata: {}
        })
      });

      const data1 = await res1.json();
      if (!data1 || !data1[0]?.url) throw new Error('UploadThing response invalid');

      const { url, key } = data1[0];

      // Step 2: Upload the file to the pre-signed URL
      const res2 = await fetch(url, {
        method: 'PUT',
        body: file
      });

      if (!res2.ok) throw new Error('Upload failed to S3');

      const uploadedUrl = url.split('?')[0];

      // Step 3: Update Supabase record
      const { error } = await supabase
        .from('custom_requests')
        .update({ uploadUrl: uploadedUrl, status: 'delivered' })
        .eq('id', selectedRequest.id);

      if (error) throw new Error('Failed to update Supabase');

      setStatusMsg('✅ Delivered!');
    } catch (err) {
      console.error('Upload failed:', err);
      setStatusMsg('❌ Upload failed');
    }
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
