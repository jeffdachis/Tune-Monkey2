import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error loading requests:', error);
      else {
        setRequests(data);
        setFiltered(data); // initial unfiltered set
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    let result = [...requests];

    if (filter !== 'All') {
      result = result.filter((r) => (r.status || 'pending') === filter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.requester_name && r.requester_name.toLowerCase().includes(term)) ||
          (r.email && r.email.toLowerCase().includes(term))
      );
    }

    setFiltered(result);
  }, [filter, search, requests]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selected) return alert('Missing file or request');

    setStatusMsg('Uploading...');
    try {
      const filePath = `${selected.id}/${file.name}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('tunes')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: publicData } = supabase.storage
        .from('tunes')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;

      const { error: updateError } = await supabase
        .from('custom_requests')
        .update({
          uploadUrl: publicUrl,
          downloadUrl: publicUrl,
          file_type: file.type,
          file_size: file.size,
          status: 'delivered'
        })
        .eq('id', selected.id);

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
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
        </select>

        <input
          type="text"
          placeholder="Search name/email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: 10 }}
        />
      </div>

      {filtered.length === 0 ? (
        <p>No matching tune requests.</p>
      ) : (
        <ul>
          {filtered.map((r) => (
            <li key={r.id} style={{ marginBottom: 20 }}>
              <strong>{r.email || 'No email'}</strong> — {r.motor} / {r.controller}
              <br />
              {r.requester_name && <div>Name: {r.requester_name}</div>}
              <small>User ID: {r.user_id}</small><br />
              Status: {r.status || 'pending'}
              <button style={{ marginLeft: 10 }} onClick={() => setSelected(r)}>
                Select
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div style={{ marginTop: 30 }}>
          <h2>Upload .json for: {selected.id}</h2>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload} style={{ marginLeft: 10 }}>
            Upload
          </button>
          {uploadUrl && (
            <p>
              ✅ Uploaded URL:{' '}
              <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
                {uploadUrl}
              </a>
            </p>
          )}
          <p>{statusMsg}</p>
        </div>
      )}
    </main>
  );
}
