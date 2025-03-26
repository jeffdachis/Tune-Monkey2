import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UT_API_KEY } from '../uploadthing.config';
import { genUploader } from "uploadthing/client";
import type { UploadRouter } from "../api/uploadthing";
export const { uploadFiles } = genUploader<UploadRouter>();

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [delivered, setDelivered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    };
    fetchRequests();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file || !selectedRequestId) {
      alert("Missing file or request ID");
      return;
    }
    setErrorMsg('');
    try {
      const res = await uploadFiles("uploadTune", { files: [file] });
      console.log("UploadThing response:", res);
      if (!res || !res[0]?.url) {
        throw new Error("UploadThing did not return a valid URL");
      }
      const fileUrl = res[0].url;
      setUploadUrl(fileUrl);
    } catch (error) {
      console.error("Error during file upload:", error);
      setErrorMsg(error.message);
    }
  };

  const sendFile = async () => {
    if (!uploadUrl || !selectedRequestId) {
      alert("Missing file URL or request ID");
      return;
    }
    const { error } = await supabase
      .from('custom_requests')
      .update({ downloadUrl: uploadUrl, status: 'delivered' })
      .eq('id', selectedRequestId);
    if (!error) {
      setDelivered(true);
    } else {
      alert("Error delivering file");
    }
  };

  return (
    <main>
      <h1>Admin Panel</h1>
      <h2>Pending Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req.id}>
            <strong>{req.email}</strong> - {req.tune_type} ({req.battery}, {req.motor})
            <button onClick={() => setSelectedRequestId(req.id)}>Select</button>
          </li>
        ))}
      </ul>
      {selectedRequestId && (
        <>
          <h3>For Request ID: {selectedRequestId}</h3>
          <input type="file" accept=".json" onChange={handleFileChange} /><br />
          <button onClick={uploadFile}>Upload</button>
          {uploadUrl && <p>Uploaded to: {uploadUrl}</p>}
          {uploadUrl && !delivered && <button onClick={sendFile}>Send File to User</button>}
          {delivered && <p style={{ color: 'green' }}>✅ Delivered!</p>}
        </>
      )}
      {errorMsg && <p style={{ color: 'red' }}>Error: {errorMsg}</p>}
    </main>
  );
}
