import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { auth } from './firebase';

export async function submitCustomTuneRequest(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in.");
  const docRef = await addDoc(collection(db, 'customRequests'), {
    ...data,
    userId: user.uid
  });
  return docRef.id;
}