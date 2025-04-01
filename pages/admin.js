import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData?.is_admin) {
        console.warn('Not authorized or not admin');
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        return;
      }

      const uniqueUserIds = [...new Set(requestsData.map(r => r.user_id))];
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', uniqueUserIds);

      const userMap = {};
      if (userProfiles) {
        for (const user of userProfiles) {
          userMap[user.user_id] = user;
        }
      }

      const merged = requestsData.map(req => ({
        ...req,
        requester: userMap[req.user_id] || {},
      }));

      setRequests(merged);
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
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <strong>{r.requester?.first_name || 'Unknown'} {r.requester?.last_name || ''}</strong><br />
            <em>{r.requester?.email || 'No email'}</em><br />
            {r.motor} / {r.controller}<br />
            <small>User ID: {r.user_id}</small><br />
            Status: {r.status || 'pending'}
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
              ✅ Uploaded URL: <a href={uploadUrl} target="_blank" rel="noopener noreferrer">{uploadUrl}</a>
            </p>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}