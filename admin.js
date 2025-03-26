import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UT_API_KEY } from '../uploadthing.config';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    setErrorMsg('');
    if (!file || !requestId) {
      alert("Missing file or request ID");
      return;
    }

    try {
      console.log("Initiating file upload for request:", requestId);
      const res = await fetch("https://uploadthing.com/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: file.name, type: file.type }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`UploadThing POST failed: ${res.status} ${errText}`);
      }

      const json = await res.json();
      console.log("UploadThing response:", json);

      if (!json.url) {
        throw new Error("UploadThing response did not contain a URL");
      }

      // PUT the file to the provided URL
      const putRes = await fetch(json.url, { method: "PUT", body: file });
      if (!putRes.ok) {
        const putErr = await putRes.text();
        throw new Error(`PUT failed: ${putRes.status} ${putErr}`);
      }
      
      const fileUrl = json.url.split("?")[0];
      console.log("File uploaded, final URL:", fileUrl);
      setUploadUrl(fileUrl);
    } catch (error) {
      console.error("❌ Error during file upload:", error);
      setErrorMsg(error.message);
    }
  };

  const sendFile = async () => {
    if (!uploadUrl || !requestId) {
      alert("Missing file URL or request ID");
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_requests')
        .update({ downloadUrl: uploadUrl, status: 'delivered' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }
      setDelivered(true);
      console.log("File delivery successful for request:", requestId);
    } catch (err) {
      console.error("❌ Error delivering file:", err);
      setErrorMsg("Error delivering file: " + err.message);
    }
  };

  return (
    <main>
      <h1>Admin Panel</h1>
      <input
        type="text"
        placeholder="Request ID"
        onChange={(e) => setRequestId(e.target.value)}
      />
      <br />
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
      />
      <br />
      <button onClick={uploadFile}>Upload</button>
      {uploadUrl && <p>Uploaded to: {uploadUrl}</p>}
      {uploadUrl && !delivered && (
        <button onClick={sendFile}>Send File to User</button>
      )}
      {delivered && <p style={{ color: 'green' }}>✅ Delivered!</p>}
      {errorMsg && <p style={{ color: 'red' }}>Error: {errorMsg}</p>}
    </main>
  );
}
