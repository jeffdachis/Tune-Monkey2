import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [versions, setVersions] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch requests
      const { data: requestsData, error: requestError } = await supabase
        .from('custom_requests')
        .select('*, user_profiles (first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (requestError) {
        console.error('Error fetching requests:', requestError);
        return;
      }

      // Fetch file versions
      const { data: fileVersions, error: versionError } = await supabase
        .from('file_versions')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (versionError) {
        console.error('Error fetching file versions:', versionError);
        return;
      }

      const grouped = fileVersions.reduce((acc, v) => {
        const key = v.request_id;
        acc[key] = acc[key] || [];
        acc[key].push(v);
        return acc;
      }, {});

      setRequests(requestsData);
      setVersions(grouped);
      setLoading(false);
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

      const { error: uploadError } = await supabase.storage
        .from('tunes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('tunes').getPublicUrl(filePath);

      await supabase.from('custom_requests')
        .update({
          uploadUrl: publicUrl,
          downloadUrl: publicUrl,
          status: 'delivered',
          file_type: file.type,
          file_size: file.size,
        })
        .eq('id', selectedRequest.id);

      await supabase.from('file_versions').insert([
        {
          request_id: selectedRequest.id,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          version_name: file.name,
        },
      ]);

      setUploadUrl(publicUrl);
      setStatusMsg('✅ Delivered!');
    } catch (err) {
      console.error('Upload failed:', err);
      setStatusMsg('❌ Upload failed');
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading admin panel...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id} style={{ marginBottom: 24 }}>
              <strong>{r.user_profiles?.email || 'Unknown email'}</strong> — {r.motor} / {r.controller}<br />
              Status: <strong>{r.status}</strong><br />
              Submitted by: {r.user_id}<br />
              <button onClick={() => setSelectedRequest(r)} style={{ marginTop: 5 }}>
                Select
              </button>

              {versions[r.id] && (
                <div style={{ marginTop: 10, paddingLeft: 20 }}>
                  <em>File Versions:</em>
                  <ul>
                    {versions[r.id].map((v, idx) => (
                      <li key={idx}>
                        <a href={v.file_url} target="_blank" rel="noopener noreferrer" download>
                          {v.version_name} ({(v.file_size / 1024).toFixed(1)} KB)
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {selectedRequest && (
        <div style={{ marginTop: 40 }}>
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