import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [versions, setVersions] = useState({});

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: allRequests, error } = await supabase
        .from('custom_requests')
        .select('*, user_profiles(first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(allRequests);

        // Fetch file versions per request
        const { data: fileVersions, error: versionError } = await supabase
          .from('file_versions')
          .select('*')
          .order('uploaded_at', { ascending: false });

        if (versionError) {
          console.error('Error loading file versions:', versionError);
        } else {
          const grouped = fileVersions.reduce((acc, version) => {
            const key = version.request_id;
            acc[key] = acc[key] || [];
            acc[key].push(version);
            return acc;
          }, {});
          setVersions(grouped);
        }
      }
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
        data: { publicUrl },
      } = supabase.storage.from('tunes').getPublicUrl(filePath);

      // Update main record
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

      // Insert file version record
      const { error: versionError } = await supabase
        .from('file_versions')
        .insert([
          {
            request_id: selectedRequest.id,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            version_name: file.name,
          },
        ]);

      if (versionError) throw versionError;

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
          <li key={r.id} style={{ marginBottom: 24 }}>
            <strong>{r.user_profiles?.email || 'Unknown email'}</strong> — {r.motor} / {r.controller}
            <br />
            Status: <strong>{r.status}</strong>
            <br />
            Submitted by: {r.user_id}
            <br />
            <button style={{ marginTop: 6 }} onClick={() => setSelectedRequest(r)}>
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

      {selectedRequest && (
        <div style={{ marginTop: 40 }}>
          <h2>Upload .json for: {selectedRequest.id}</h2>
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
