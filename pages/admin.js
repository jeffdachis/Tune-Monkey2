import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth, storage } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryGetDownloadURL(ref, maxRetries = 5, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const url = await getDownloadURL(ref);
      console.log("✅ Download URL ready on attempt", i + 1);
      return url;
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed:`, err.message);
      await sleep(delay);
    }
  }
  throw new Error("Exceeded max retries for getDownloadURL");
}

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/');
        return;
      }
      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists() || !userSnap.data().isAdmin) {
        router.push('/');
        return;
      }
      const snapshot = await getDocs(collection(db, 'customRequests'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const updateRequest = async (id, field, value) => {
    try {
      const refDoc = doc(db, 'customRequests', id);
      await updateDoc(refDoc, { [field]: value });
      console.log(\`Updated \${field} for \${id}\`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    } catch (err) {
      console.error(\`❌ Failed to update \${field} for \${id}:\`, err);
      setMessage(\`❌ Firestore update failed for \${id}\`);
    }
  };

  const handleFileUpload = async (e, reqId) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/json") {
      alert("Only .json files allowed.");
      return;
    }

    try {
      console.log(\`Uploading file for request: \${reqId}\`);
      const storageRef = ref(storage, \`tunes/requests/\${reqId}.json\`);
      await uploadBytes(storageRef, file);
      console.log("✅ Upload complete");

      const url = await retryGetDownloadURL(storageRef);
      console.log("✅ Final Download URL:", url);

      const refDoc = doc(db, 'customRequests', reqId);
      await updateDoc(refDoc, { uploadUrl: url });

      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, uploadUrl: url } : r))
      );

      setMessage(\`✅ File uploaded and uploadUrl set for \${reqId}\`);
    } catch (err) {
      console.error("❌ Upload or getDownloadURL failed:", err);
      setMessage(\`❌ Upload or Firestore error for \${reqId}\`);
    }
  };

  const handleSendFile = async (reqId, uploadUrl) => {
    if (!uploadUrl) {
      alert("No uploaded file to send.");
      return;
    }

    try {
      console.log(\`Sending file to user for request: \${reqId}\`);
      await updateDoc(doc(db, 'customRequests', reqId), {
        downloadUrl: uploadUrl,
        status: 'delivered'
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, downloadUrl: uploadUrl, status: 'delivered' } : r
        )
      );

      setMessage(\`📤 File delivered for \${reqId}\`);
    } catch (err) {
      console.error("❌ Failed to deliver file:", err);
      setMessage(\`❌ Send failed for \${reqId}\`);
    }
  };

  return (
    <main>
      <h1>Admin Panel (Retry Mode)</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              <strong>User:</strong> {req.userId}<br />
              <strong>Motor:</strong> {req.motor} | <strong>Controller:</strong> {req.controller} | <strong>Battery:</strong> {req.battery}<br />
              <strong>Goals:</strong> {req.goals}<br />
              <strong>Status:</strong>
              <select
                value={req.status || 'pending'}
                onChange={(e) => updateRequest(req.id, 'status', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="delivered">Delivered</option>
              </select><br />
              <strong>Manual URL:</strong>
              <input
                type="text"
                value={req.downloadUrl || ''}
                onChange={(e) => updateRequest(req.id, 'downloadUrl', e.target.value)}
              /><br />
              <strong>Upload File:</strong>
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, req.id)}
              /><br />
              {req.uploadUrl && !req.downloadUrl && (
                <button onClick={() => handleSendFile(req.id, req.uploadUrl)}>
                  ✅ Send File to User
                </button>
              )}
              {(req.status === 'delivered' && req.downloadUrl) && (
                <p style={{ color: 'green' }}>✅ Delivered to user</p>
              )}
              <hr />
            </li>
          ))}
        </ul>
      )}
      <a href="/">Back to Home</a>
    </main>
  );
}