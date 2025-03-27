import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data);
      }
    };

    fetchRequests();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
  if (!file || !selectedRequestId) {
    alert("Missing file or request selection");
    return;
  }

  try {
    // STEP 1: Get signed upload URL
    const res = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPLOADTHING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        type: file.type,
      }),
    });

    const json = await res.json();
    const uploadUrl = json?.url;

    if (!uploadUrl) {
      throw new Error("Failed to get upload URL");
    }

    // STEP 2: Upload file to signed URL
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Upload to signed URL failed");
    }

    const finalUrl = uploadUrl.split("?")[0];

    // STEP 3: Update Supabase
    const { error } = await supabase
      .from("custom_requests")
      .update({
        uploadUrl: finalUrl,
        status: 'delivered',
      })
      .eq('id', selectedRequestId);

    if (error) {
      throw new Error("Failed to update Supabase");
    }

    setDelivered(true);
    alert("✅ File uploaded and delivered!");
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed: " + err.message);
  }
};


  return (
    <main style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      <ul>
        {requests.map((req) => (
          <li key={req.id} style={{ marginBottom: 10 }}>
            <strong>ID:</strong> {req.id}<br />
            <strong>User:</strong> {req.email || req.user_id}<br />
            <strong>Status:</strong> {req.status}<br />
            <button onClick={() => setSelectedRequestId(req.id)}>Select</button>
          </li>
        ))}
      </ul>

      {selectedRequestId && (
        <>
          <p>Selected Request ID: {selectedRequestId}</p>
          <input type="file" accept=".json" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
          {delivered && <p style={{ color: "green" }}>✅ Delivered</p>}
        </>
      )}
    </main>
  );
}
