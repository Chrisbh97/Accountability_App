import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestore = (collectionName) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    });

    return unsubscribe;
  }, [collectionName]);

  const addDocument = async (data) => {
    await addDoc(collection(db, collectionName), data);
  };

  const updateDocument = async (id, data) => {
    await updateDoc(doc(db, collectionName, id), data);
  };

  return { documents, addDocument, updateDocument };
};
