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
      <h1>My Dashboard (Debug Mode)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((req) => (
            <li key={req.id} style={{ marginBottom: '2rem' }}>
              <pre>{JSON.stringify(req, null, 2)}</pre>
              {req.status === 'delivered' && req.downloadUrl && (
                <a href={req.downloadUrl} target="_blank" rel="noopener noreferrer">
                  🔽 Download Your Tune
                </a>
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