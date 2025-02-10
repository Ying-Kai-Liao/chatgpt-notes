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
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null; // For nested workspaces
  color: string; // For UI customization
  icon: string; // For UI customization
}

interface FirestoreWorkspace extends Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const workspaceConverter: FirestoreDataConverter<FirestoreWorkspace> = {
  toFirestore: (workspace: FirestoreWorkspace) => {
    return {
      userId: workspace.userId,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      parentId: workspace.parentId,
      color: workspace.color,
      icon: workspace.icon,
    };
  },
  fromFirestore: (snapshot): FirestoreWorkspace => {
    const data = snapshot.data();
    return {
      userId: data.userId,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      parentId: data.parentId,
      color: data.color,
      icon: data.icon,
    };
  },
};

export async function createWorkspace(
  userId: string,
  name: string,
  description: string = '',
  parentId: string | null = null,
  color: string = '#4F46E5', // Default indigo color
  icon: string = '📁' // Default folder icon
): Promise<string> {
  const now = Timestamp.now();
  const workspaceData: FirestoreWorkspace = {
    userId,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    parentId,
    color,
    icon,
  };

  const workspacesRef = collection(db, 'workspaces').withConverter(workspaceConverter);
  const docRef = await addDoc(workspacesRef, workspaceData);
  return docRef.id;
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const workspaceRef = doc(db, 'workspaces', workspaceId).withConverter(workspaceConverter);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    return null;
  }

  return {
    id: workspaceSnap.id,
    ...workspaceSnap.data(),
    createdAt: workspaceSnap.data().createdAt.toDate(),
    updatedAt: workspaceSnap.data().updatedAt.toDate(),
  };
}

export async function getUserWorkspaces(userId: string, parentId: string | null = null): Promise<Workspace[]> {
  const workspacesRef = collection(db, 'workspaces').withConverter(workspaceConverter);
  const q = query(
    workspacesRef,
    where('userId', '==', userId),
    where('parentId', '==', parentId)
    // We'll add this back after creating the index
    // orderBy('name')
  );
  
  const querySnapshot = await getDocs(q);
  const workspaces = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  }));

  // Sort in memory for now
  return workspaces.sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Pick<Workspace, 'name' | 'description' | 'color' | 'icon'>>
): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  await updateDoc(workspaceRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, 'workspaces', workspaceId);
  const notesRef = collection(db, 'notes');
  const notesQuery = query(notesRef, where('workspaceId', '==', workspaceId));

  // Move all notes in this workspace to root (no workspace)
  const notesSnapshot = await getDocs(notesQuery);
  const batch = writeBatch(db);

  notesSnapshot.forEach((doc) => {
    batch.update(doc.ref, {
      workspaceId: null,
      updatedAt: Timestamp.now(),
    });
  });

  // Delete the workspace
  batch.delete(workspaceRef);

  // Commit all changes
  await batch.commit();
}

// Update note schema to include workspaceId
export async function moveNoteToWorkspace(noteId: string, workspaceId: string | null): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    workspaceId,
    updatedAt: Timestamp.now(),
  });
}
