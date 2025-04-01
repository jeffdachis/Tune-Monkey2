import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedRequest) return alert('Missing file or request');

    setStatusMsg('Uploading...');

    try {
      const filePath = `${selectedRequest.id}/${file.name}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('tunes')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('tunes').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('custom_requests')
        .update({
          uploadUrl: publicUrl,
          downloadUrl: publicUrl,
          status: 'delivered',
          file_type: file.type,
          file_size: file.size,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      setUploadUrl(publicUrl);
      setStatusMsg('✅ Delivered!');
      fetchRequests();
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  const sortRequests = (requests) => {
    const sorted = [...requests];
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'status':
        return sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      case 'email':
        return sorted.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 1000 }}>
      <h1>Admin Panel</h1>

      <label>Sort by:&nbsp;</label>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginBottom: 20 }}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="status">Status</option>
        <option value="email">Email</option>
      </select>

      <ul>
        {sortRequests(requests).map((r) => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <strong>{r.email}</strong> — {r.motor} / {r.controller}<br />
            Status: {r.status || 'pending'}<br />
            {r.downloadUrl ? (
              <a href={r.downloadUrl} target="_blank" rel="noopener noreferrer">Download</a>
            ) : (
              <em>No file uploaded</em>
            )}
            <br />
            <button style={{ marginTop: 5 }} onClick={() => setSelectedRequest(r)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequest && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: 10 }}>Upload</button>
          {uploadUrl && (
            <p>
              ✅ Uploaded URL: <a href={uploadUrl} target="_blank" rel="noopener noreferrer">{uploadUrl}</a>
            </p>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
