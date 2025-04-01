import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*, user_profiles(first_name, last_name, email, phone)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data);
        setFiltered(data);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    let result = [...requests];

    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.user_profiles?.email?.toLowerCase().includes(q) ||
        r.user_profiles?.first_name?.toLowerCase().includes(q) ||
        r.user_profiles?.last_name?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [filterStatus, searchQuery, requests]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

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

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Status Filter: </label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
        </select>

        <input
          type="text"
          placeholder="Search name/email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginLeft: 20 }}
        />
      </div>

      <ul>
        {filtered.map((r) => (
          <li key={r.id} style={{ marginBottom: 16 }}>
            <strong>{r.motor} / {r.controller}</strong><br />
            <span>Status: {r.status || 'pending'}</span><br />
            <span>File Type: {r.file_type || 'N/A'} — Size: {r.file_size ? `${(r.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span><br />
            {r.user_profiles && (
              <span>
                👤 {r.user_profiles.first_name} {r.user_profiles.last_name} — {r.user_profiles.email} — 📞 {r.user_profiles.phone}
              </span>
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
