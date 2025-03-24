import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth, storage } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const refDoc = doc(db, 'customRequests', id);
    await updateDoc(refDoc, { [field]: value });
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleFileUpload = async (e, reqId) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/json") {
      alert("Only .json files allowed.");
      return;
    }

    const storageRef = ref(storage, `tunes/requests/${reqId}.json`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateRequest(reqId, 'downloadUrl', url);
  };

  return (
    <main>
      <h1>Admin Panel</h1>
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
              <strong>Or Upload File:</strong>
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, req.id)}
              /><br />
              <hr />
            </li>
          ))}
        </ul>
      )}
      <a href="/">Back to Home</a>
    </main>
  );
}
