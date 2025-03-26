import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UT_API_KEY } from '../uploadthing.config';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file || !requestId) return alert("Missing file or request ID");

    const res = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: file.name, type: file.type }),
    });

    const { url, key } = await res.json();
    await fetch(url, { method: "PUT", body: file });
    const fileUrl = url.split("?")[0];
    setUploadUrl(fileUrl);
  };

  const sendFile = async () => {
    if (!uploadUrl || !requestId) return;

    const { error } = await supabase
      .from('custom_requests')
      .update({ downloadUrl: uploadUrl, status: 'delivered' })
      .eq('id', requestId);

    if (!error) {
      setDelivered(true);
    } else {
      alert("Error delivering file");
    }
  };

  return (
    <main>
      <h1>Admin Panel</h1>
      <input type="text" placeholder="Request ID" onChange={(e) => setRequestId(e.target.value)} />
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={uploadFile}>Upload</button>
      {uploadUrl && <p>Uploaded to: {uploadUrl}</p>}
      {uploadUrl && !delivered && <button onClick={sendFile}>Send File to User</button>}
      {delivered && <p>✅ Delivered!</p>}
    </main>
  );
}