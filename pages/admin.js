import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.is_admin) return;

      setAdminUser(user);

      const { data: requestsData, error: fetchError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching requests:', fetchError);
        return;
      }

      setRequests(requestsData);
    };

    fetchData();
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
        .upload(filePath, file, {
          upsert: true,
        });

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
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      {requests.length === 0 ? (
        <p>No tune requests found.</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id} style={{ marginBottom: 20 }}>
              <strong>{r.motor} / {r.controller}</strong><br />
              <small>User ID: {r.user_id}</small><br />
              <small>Email: {r.email || 'unknown'}</small><br />
              Status: <strong>{r.status || 'pending'}</strong><br />
              {r.downloadUrl && (
                <a
                  href={`${r.downloadUrl}?download=${r.id}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ⬇️ Download
                </a>
              )}
              <br />
              <button onClick={() => setSelectedRequest(r)}>Select</button>
            </li>
          ))}
        </ul>
      )}

      {selectedRequest && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: 10 }}>
            Upload
          </button>
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