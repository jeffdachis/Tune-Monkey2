import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const ADMIN_EMAIL = "jeffreydachis@gmail.com"; // Change this to your actual email

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        router.push('/');
      } else {
        setUser(u);
        const snapshot = await getDocs(collection(db, 'customRequests'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(data);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const updateRequest = async (id, field, value) => {
    const ref = doc(db, 'customRequests', id);
    await updateDoc(ref, { [field]: value });
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
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
              <strong>Download URL:</strong>
              <input
                type="text"
                value={req.downloadUrl || ''}
                onChange={(e) => updateRequest(req.id, 'downloadUrl', e.target.value)}
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
