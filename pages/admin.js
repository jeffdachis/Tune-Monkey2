import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Admin() {
  const [requestId, setRequestId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [delivered, setDelivered] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file || !requestId) {
      alert("Missing file or request ID");
      return;
    }

    // Simulate upload via dummy endpoint
    const res = await fetch("/api/uploadthing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type }),
    });

    const data = await res.json();
    const fileUrl = data?.url;

    if (!fileUrl) {
      alert("Upload failed");
      return;
    }

    setUploadUrl(fileUrl);

    const { error } = await supabase
      .from("custom_requests")
      .update({ uploadUrl: fileUrl, status: "delivered" })
      .eq("id", requestId);

    if (error) {
      console.error("Supabase update failed:", error);
      alert("Supabase update failed");
    } else {
      setDelivered(true);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      <input
        type="text"
        placeholder="Request ID"
        value={requestId}
        onChange={(e) => setRequestId(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button onClick={uploadFile}>Upload</button>

      {uploadUrl && <p>Uploaded to: {uploadUrl}</p>}
      {delivered && <p>✅ Delivered!</p>}
    </main>
  );
}
