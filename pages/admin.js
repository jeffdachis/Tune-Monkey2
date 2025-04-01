import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data);
      }

      setLoading(false);
    };

    fetchRequests();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedRequest) {
      alert('Missing file or request');
      return;
    }

    setStatusMsg('Uploading...');
    try {
      const filePath = `${selectedRequest.id}/${file.name}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('tunes')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('tunes').getPublicUrl(filePath);

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
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  if (loading) return <main style={{ padding: 40 }}><p>Loading admin panel...</p></main>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 18 }}>
            <strong>{r.user_profiles?.first_name || 'Unknown'} {r.user_profiles?.last_name || ''}</strong><br />
            <small>{r.user_profiles?.email || 'No email'}</small><br />
            <strong>{r.motor}</strong> / {r.controller}<br />
            Status: <strong>{r.status || 'pending'}</strong><br />
            File: {r.file_type || 'N/A'}, {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'N/A'}<br />
            {r.downloadUrl ? (
              <a href={`${r.downloadUrl}?download=${r.id}.json`} target="_blank" rel="noopener noreferrer">
                ⬇️ Download
              </a>
            ) : (
              <em>Not delivered</em>
            )}
            <br />
            <button style={{ marginTop: 4 }} onClick={() => setSelectedRequest(r)}>
              Select
            </button>
          </li>
        ))}
      </ul>

      {selectedRequest && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload Tune for Request: {selectedRequest.id}</h2>
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