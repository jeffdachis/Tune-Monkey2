import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: requestData, error: requestError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestError) {
        console.error('Request fetch error:', requestError);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email');

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }

      const enriched = requestData.map((r) => {
        const profile = profiles.find((p) => p.user_id === r.user_id);
        return {
          ...r,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          email: profile?.email || 'Unknown',
        };
      });

      setRequests(enriched);
      setFilteredRequests(enriched);
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    let result = [...requests];

    if (statusFilter !== 'All') {
      result = result.filter((r) => r.status === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.email?.toLowerCase().includes(term) ||
          r.userName?.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(result);
  }, [statusFilter, searchTerm, requests]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file || !selectedRequest) return alert('Missing file or request');
    setStatusMsg('Uploading...');

    try {
      const filePath = `${selectedRequest.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('tunes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

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

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      <label>
        Status Filter:{' '}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Delivered</option>
        </select>
      </label>

      <input
        type="text"
        placeholder="Search name/email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginLeft: 20 }}
      />

      <ul style={{ marginTop: 20 }}>
        {filteredRequests.map((r) => (
          <li key={r.id} style={{ marginBottom: 18 }}>
            <strong>{r.email}</strong> — {r.motor} / {r.controller}<br />
            Submitted by: {r.user_id}<br />
            Name: {r.userName}<br />
            Status: <strong>{r.status}</strong>
            <button style={{ marginLeft: 12 }} onClick={() => setSelectedRequest(r)}>
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