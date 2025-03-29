import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [publicUrl, setPublicUrl] = useState('');

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

    const { error: uploadError } = await supabase.storage
      .from('tunes')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      setStatusMsg('❌ Upload failed');
      return;
    }

    const { data: urlData } = supabase
      .storage
      .from('tunes')
      .getPublicUrl(filePath);

    const url = urlData?.publicUrl;
    setPublicUrl(url);

    const { error: updateError } = await supabase
      .from('custom_requests')
      .update({
        uploadUrl: url,
        status: 'delivered',
        file_type: file.type,
        file_size: file.size
      })
      .eq('id', selectedRequest.id);

    if (updateError) {
      console.error('Failed to update Supabase:', updateError);
      setStatusMsg('❌ DB update failed');
    } else {
      setStatusMsg('✅ Delivered!');
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 8 }}>
            <strong>{r.email || 'No email'}</strong> — {r.motor} / {r.controller}<br />
            Status: {r.status || 'pending'}<br />
            {r.uploadUrl && (
              <>
                Download: <a href={r.uploadUrl} target="_blank" rel="noopener noreferrer">{r.uploadUrl}</a><br />
              </>
            )}
            <button style={{ marginTop: 4 }} onClick={() => setSelectedRequest(r)}>Select</button>
          </li>
        ))}
      </ul>
      {selectedRequest && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: 10 }}>Upload</button>
          {publicUrl && (
            <div style={{ marginTop: 10 }}>
              ✅ Uploaded URL: <a href={publicUrl} target="_blank" rel="noopener noreferrer">{publicUrl}</a>
            </div>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
