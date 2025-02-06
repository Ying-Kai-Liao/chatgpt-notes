import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Note {
  id: string;
  userId: string;
  content: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  shareId?: string;
}

interface FirestoreNote extends Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const noteConverter: FirestoreDataConverter<FirestoreNote> = {
  toFirestore: (note: FirestoreNote) => {
    const data = {
      userId: note.userId,
      content: note.content,
      title: note.title,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      isPublic: note.isPublic,
      shareId: note.shareId || null,
    };
    
    return data;
  },
  fromFirestore: (snapshot): FirestoreNote => {
    const data = snapshot.data();
    return {
      userId: data.userId,
      content: data.content,
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isPublic: data.isPublic || false,
      shareId: data.shareId || null,
    };
  },
};

export async function createNote(userId: string, content: string): Promise<string> {
  try {
    if (!content) {
      throw new Error('Content cannot be empty');
    }

    // Extract title from the first heading to the next heading or end of text
    const titleMatch = content.match(/^#\s+([^\n]+)(?:\n|$)/m);
    let title = 'Untitled Note';
    
    if (titleMatch) {
      // Get the content after # and trim it
      title = titleMatch[1].trim().replace(/^\s*|\s*$/g, '');
      
      // If title is too long, truncate it
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
    }

    const noteData: Omit<FirestoreNote, 'createdAt' | 'updatedAt' | 'shareId'> = {
      userId,
      content,
      title,
      isPublic: false,
    };

    const docRef = await addDoc(collection(db, 'notes').withConverter(noteConverter), {
      ...noteData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

export async function getNote(noteId: string): Promise<Note | null> {
  try {
    const docRef = doc(db, 'notes', noteId).withConverter(noteConverter);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const notesQuery = query(
    collection(db, 'notes'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(notesQuery);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Note[];
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
}

export async function toggleNoteSharing(noteId: string): Promise<{ isPublic: boolean; shareId: string }> {
  const noteRef = doc(db, 'notes', noteId);
  const noteSnap = await getDoc(noteRef);
  
  if (!noteSnap.exists()) {
    throw new Error('Note not found');
  }

  const noteData = noteSnap.data();
  const isPublic = !noteData.isPublic;
  const shareId = isPublic ? (noteData.shareId || crypto.randomUUID()) : null;

  await updateDoc(noteRef, {
    isPublic,
    shareId,
    updatedAt: Timestamp.now(),
  });

  return { isPublic, shareId };
}

export async function getNoteByShareId(shareId: string): Promise<Note | null> {
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where('shareId', '==', shareId), where('isPublic', '==', true));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  } as Note;
}

export async function updateNote(noteId: string, content: string): Promise<void> {
  try {
    if (!content) {
      throw new Error('Content cannot be empty');
    }

    // Extract title from the first heading to the next heading or end of text
    const titleMatch = content.match(/^#\s+([^\n]+)(?:\n|$)/m);
    let title = 'Untitled Note';
    
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/^\s*|\s*$/g, '');
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
    }

    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      content,
      title,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}
