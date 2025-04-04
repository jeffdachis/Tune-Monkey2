import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: requestData, error: requestError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email');

      if (requestError || profileError) {
        console.error('Error fetching data:', requestError || profileError);
        return;
      }

      const combined = requestData.map((r) => {
        const profile = profileData.find((p) => p.user_id === r.user_id) || {};
        return {
          ...r,
          requester_name: `${profile.first_name || 'Unknown'} ${profile.last_name || ''}`.trim(),
          requester_email: profile.email || 'Unknown'
        };
      });

      setRequests(combined);
    };

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
        data: { publicUrl }
      } = supabase.storage.from('tunes').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('custom_requests')
        .update({
          uploadUrl: publicUrl,
          downloadUrl: publicUrl,
          status: 'delivered',
          file_type: file.type,
          file_size: file.size
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

  const filtered = search
    ? requests.filter((r) =>
        (r.motor + r.controller + r.requester_email + r.requester_name)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : requests;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <input
        type="text"
        placeholder="Search motor, controller, name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20, width: '100%' }}
      />

      <ul>
        {filtered.map((r) => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <strong>{r.requester_name}</strong> ({r.requester_email})<br />
            <strong>{r.motor} / {r.controller}</strong><br />
            Status: <strong>{r.status || 'pending'}</strong>
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
          {uploadUrl && (
            <p>
              ✅ Uploaded URL:{' '}
              <a href={uploadUrl} target="_blank" rel="noopener noreferrer">{uploadUrl}</a>
            </p>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
