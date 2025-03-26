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
      // Step 1: get signed URL
      const res = await fetch("https://uploadthing.com/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPLOADTHING_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          type: file.type
        }),
      });

      const json = await res.json();

      if (!json || !json.url) {
        throw new Error("Failed to get upload URL");
      }

      // Step 2: upload file to UploadThing
      await fetch(json.url, {
        method: "PUT",
        body: file
      });

      const uploadedUrl = json.url.split("?")[0];

      // Step 3: update Supabase with uploaded URL
      const { error } = await supabase
        .from('custom_requests')
        .update({
          uploadUrl: uploadedUrl,
          status: 'delivered'
        })
        .eq('id', selectedRequestId);

      if (error) {
