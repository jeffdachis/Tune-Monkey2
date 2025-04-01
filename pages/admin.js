import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*, user_profiles:user_id (first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all requests:', error);
      } else {
        setRequests(data);
      }
    };

    fetchAllRequests();
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

      const { data: publicData } = supabase.storage.from('tunes').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('custom_requests')
        .update({
          uploadUrl: publicData.publicUrl,
          downloadUrl: publicData.publicUrl,
          status: 'delivered',
          file_type: file.type,
          file_size: file.size,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      setUploadUrl(publicData.publicUrl);
      setStatusMsg('✅ Delivered!');
    } catch (err) {
      console.error('Upload error:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filter === 'All' || r.status === filter;
    const fullName = `${r.user_profiles?.first_name || ''} ${r.user_profiles?.last_name || ''}`.toLowerCase();
    const email = (r.user_profiles?.email || '').toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Status Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginRight: 10 }}>
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
        </select>

        <input
          type="text"
          placeholder="Search name/email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ul>
        {filteredRequests.map((r) => (
          <li key={r.id} style={{ marginBottom: 16 }}>
            <strong>{r.user_profiles?.email || 'Unknown email'}</strong> — {r.motor} / {r.controller}<br />
            User ID: {r.user_id}<br />
            Status: {r.status || 'pending'}
            <button style={{ marginLeft: 10 }} onClick={() => setSelectedRequest(r)}>Select</button>
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
