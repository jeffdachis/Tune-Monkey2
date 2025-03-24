import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDebug() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminCheck, setAdminCheck] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError('User doc not found in Firestore');
          setAdminCheck(false);
          setLoading(false);
          return;
        }
        const userData = userSnap.data();
        if (!userData.isAdmin) {
          setError('User doc found, but isAdmin flag is missing or false');
          setAdminCheck(false);
          setLoading(false);
          return;
        }
        setAdminCheck(true);
        const snapshot = await getDocs(collection(db, 'customRequests'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(data);
        setLoading(false);
      } catch (err) {
        setError('Firestore error: ' + err.message);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <main>
      <h1>Admin Debug Panel</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {user && (
        <>
          <p><strong>Your UID:</strong> {user.uid}</p>
          <p><strong>Your Email:</strong> {user.email}</p>
        </>
      )}
      {adminCheck && requests.length > 0 && (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              <strong>User:</strong> {req.userId}<br />
              <strong>Motor:</strong> {req.motor} | <strong>Controller:</strong> {req.controller} | <strong>Battery:</strong> {req.battery}<br />
              <strong>Status:</strong> {req.status || 'pending'}
              <hr />
            </li>
          ))}
        </ul>
      )}
      <a href="/">Back to Home</a>
    </main>
  );
}