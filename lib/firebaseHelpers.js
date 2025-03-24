import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function submitCustomTuneRequest(data) {
  const docRef = await addDoc(collection(db, 'customRequests'), data);
  return docRef.id;
}