import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
        const q = query(collection(db, 'customRequests'), where('userId', '==', u.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(data);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <main>
      <h1>My Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <ul>
          {requests.map(req => (
            <li key={req.id}>
              <strong>Motor:</strong> {req.motor} | <strong>Controller:</strong> {req.controller} | <strong>Battery:</strong> {req.battery}<br/>
              <strong>Goals:</strong> {req.goals}<br/>
              <strong>Status:</strong> {req.status || 'pending'}<br/>
              {req.status === 'delivered' && req.downloadUrl && (
                <p>
                  <a href={req.downloadUrl} target="_blank" rel="noopener noreferrer">
                    🔽 Download Your Tune
                  </a>
                </p>
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