import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadFiles } from '../lib/uploadthingClient';

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

    try {
      const uploaded = await uploadFiles("uploadTune", {
        files: [file],
      });

      const fileUrl = uploaded?.[0]?.url;
      if (!fileUrl) throw new Error("No URL returned from upload");

      setUploadUrl(fileUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("File upload failed");
    }
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
