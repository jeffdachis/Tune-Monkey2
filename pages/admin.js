import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UploadButton } from '../lib/uploadthingClient';

export default function Admin() {
  const [requestId, setRequestId] = useState('');
  const [delivered, setDelivered] = useState(false);

  const handleUploadComplete = async (res) => {
    if (!res || !res[0]) {
      console.error("Upload failed");
      return;
    }

    const { url } = res[0];
    const { error } = await supabase
      .from('custom_requests')
      .update({ uploadUrl: url, status: 'delivered' })
      .eq('id', requestId);

    if (error) {
      console.error("Error updating Supabase:", error);
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
        style={{ marginBottom: 10 }}
      />
      <UploadButton
        endpoint="uploadTune"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={(e) => console.error('Upload error', e)}
      />
      {delivered && <p>✅ Delivered!</p>}
    </main>
  );
}
