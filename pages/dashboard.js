import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function fetchRequests() {
      const snapshot = await getDocs(collection(db, 'customRequests'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    }
    fetchRequests();
  }, []);

  return (
    <main>
      <h1>My Dashboard</h1>
      <section>
        <h2>Custom Tune Requests</h2>
        {requests.length === 0 ? (
          <p>No requests yet.</p>
        ) : (
          <ul>
            {requests.map(req => (
              <li key={req.id}>
                <strong>Motor:</strong> {req.motor} | <strong>Controller:</strong> {req.controller} | <strong>Battery:</strong> {req.battery}<br/>
                <strong>Goals:</strong> {req.goals}<br/>
                <strong>PAS:</strong> {req.pas ? 'Yes' : 'No'}, <strong>Regen:</strong> {req.regen ? 'Yes' : 'No'}, <strong>FW:</strong> {req.fw ? 'Yes' : 'No'}, <strong>Thermal:</strong> {req.thermal ? 'Yes' : 'No'}
                <hr />
              </li>
            ))}
          </ul>
        )}
      </section>
      <a href="/">Back to Home</a>
    </main>
  );
}
