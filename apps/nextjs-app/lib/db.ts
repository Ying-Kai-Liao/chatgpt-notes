import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  shareId?: string;
  workspaceId: string | null;
  isFavorite?: boolean;
}

const noteConverter: FirestoreDataConverter<Note> = {
  toFirestore(note: Note): DocumentData {
    return {
      userId: note.userId,
      content: note.content,
      title: note.title,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      isPublic: note.isPublic,
      shareId: note.shareId || null,
      workspaceId: note.workspaceId || null,
      isFavorite: note.isFavorite || false,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Note {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      userId: data.userId,
      content: data.content,
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isPublic: data.isPublic ?? false,
      shareId: data.shareId,
      workspaceId: data.workspaceId ?? null,
      isFavorite: data.isFavorite || false,
    };
  },
};

export async function createNote(
  userId: string,
  content: string,
  workspaceId: string | null = null
): Promise<string> {
  const notesRef = collection(db, 'notes').withConverter(noteConverter);

  // Extract title from first line, limited to 100 chars
  const title = content.split('\n')[0].slice(0, 100);

  const noteData: Omit<Note, 'id'> = {
    userId,
    content,
    title,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isPublic: false,
    workspaceId,
    isFavorite: false,
  };

  const docRef = await addDoc(notesRef, noteData);
  return docRef.id;
}

export async function getUserNotes(userId: string, workspaceId: string | null = null): Promise<Note[]> {
  const notesRef = collection(db, 'notes').withConverter(noteConverter);
  const q = query(
    notesRef,
    where('userId', '==', userId),
    where('workspaceId', '==', workspaceId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
}

export async function getNote(noteId: string): Promise<Note | null> {
  const noteRef = doc(db, 'notes', noteId).withConverter(noteConverter);
  const noteDoc = await getDoc(noteRef);

  if (!noteDoc.exists()) {
    return null;
  }

  return noteDoc.data();
}

export async function updateNote(noteId: string, content: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  const title = content.split('\n')[0].slice(0, 100);

  await updateDoc(noteRef, {
    content,
    title,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'notes', noteId));
}

export async function toggleNoteFavorite(noteId: string, isFavorite: boolean): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    isFavorite,
    updatedAt: Timestamp.now(),
  });
}

export async function moveNoteToWorkspace(noteId: string, workspaceId: string | null): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    workspaceId,
    updatedAt: Timestamp.now(),
  });
}

export async function toggleNoteShare(noteId: string): Promise<string | null> {
  const noteRef = doc(db, 'notes', noteId).withConverter(noteConverter);
  const noteDoc = await getDoc(noteRef);
  
  if (!noteDoc.exists()) {
    throw new Error('Note not found');
  }

  const note = noteDoc.data();
  const isCurrentlyShared = note.isPublic;
  
  if (isCurrentlyShared) {
    // Disable sharing
    await updateDoc(noteRef, {
      isPublic: false,
      shareId: deleteField(),
      updatedAt: Timestamp.now(),
    });
    return null;
  } else {
    // Enable sharing with a new shareId
    const shareId = crypto.randomUUID();
    await updateDoc(noteRef, {
      isPublic: true,
      shareId,
      updatedAt: Timestamp.now(),
    });
    return shareId;
  }
}

export async function getNoteByShareId(shareId: string): Promise<Note | null> {
  const notesRef = collection(db, 'notes').withConverter(noteConverter);
  const q = query(notesRef, where('shareId', '==', shareId), where('isPublic', '==', true));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data();
}

export interface WorkspaceNotesGroup {
  workspace: {
    id: string | null;
    name: string;
  };
  notes: Note[];
}

export async function getUserNotesWithWorkspaces(userId: string): Promise<WorkspaceNotesGroup[]> {
  // Get all notes
  const notesRef = collection(db, 'notes').withConverter(noteConverter);
  const q = query(notesRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const notes = querySnapshot.docs.map(doc => doc.data());

  // Get all workspaces
  const workspacesRef = collection(db, 'workspaces');
  const workspacesQuery = query(workspacesRef, where('userId', '==', userId));
  const workspacesSnapshot = await getDocs(workspacesQuery);
  const workspaces = new Map<string, { name: string }>();
  workspacesSnapshot.forEach(doc => {
    const workspace = doc.data();
    workspaces.set(doc.id, { name: workspace.name });
  });

  // Group notes by workspace
  const workspaceGroups = new Map<string | null, Note[]>();
  notes.forEach(note => {
    const workspaceId = note.workspaceId;
    if (!workspaceGroups.has(workspaceId)) {
      workspaceGroups.set(workspaceId, []);
    }
    workspaceGroups.get(workspaceId)!.push(note);
  });

  // Convert to array and sort notes within each group
  return Array.from(workspaceGroups.entries()).map(([workspaceId, notes]) => ({
    workspace: {
      id: workspaceId,
      name: workspaceId === null 
        ? 'My Notes' 
        : (workspaces.get(workspaceId)?.name || 'Unnamed Workspace'),
    },
    notes: notes.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()),
  }));
}

export interface MigrationResult {
  success: boolean;
  message: string;
  total: number;
  migrated: number;
  needsMigration: number;
}

export async function migrateNotesToWorkspace(): Promise<{ total: number; migrated: number; needsMigration: number }> {
  const batch = writeBatch(db);
  const notesRef = collection(db, 'notes').withConverter(noteConverter);
  const querySnapshot = await getDocs(notesRef);
  
  let total = 0;
  let migrated = 0;
  let needsMigration = 0;
  
  querySnapshot.forEach((doc) => {
    total++;
    const data = doc.data();
    if (data.workspaceId === undefined) {
      needsMigration++;
      batch.update(doc.ref, {
        workspaceId: null,
      });
      migrated++;
    }
  });
  
  if (needsMigration > 0) {
    await batch.commit();
  }
  
  return { total, migrated, needsMigration };
}

export async function checkMigrationStatus(): Promise<MigrationResult> {
  try {
    const notesRef = collection(db, 'notes').withConverter(noteConverter);
    const snapshot = await getDocs(notesRef);
    
    let total = 0;
    let migrated = 0;
    let needsMigration = 0;

    snapshot.forEach((doc) => {
      total++;
      const note = doc.data();
      if (note.workspaceId === undefined) {
        needsMigration++;
      } else {
        migrated++;
      }
    });

    return {
      success: true,
      message: `Found ${total} notes: ${migrated} migrated, ${needsMigration} need migration`,
      total,
      migrated,
      needsMigration
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      success: false,
      message: 'Failed to check migration status',
      total: 0,
      migrated: 0,
      needsMigration: 0
    };
  }
}

export async function migrateAllUsersNotes(): Promise<MigrationResult> {
  try {
    const notesRef = collection(db, 'notes').withConverter(noteConverter);
    const snapshot = await getDocs(notesRef);
    
    const batch = writeBatch(db);
    let migrated = 0;
    let total = 0;

    snapshot.forEach((doc) => {
      total++;
      const note = doc.data();
      if (note.workspaceId === undefined) {
        batch.update(doc.ref, { workspaceId: null });
        migrated++;
      }
    });

    if (migrated > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: migrated > 0 
        ? `Successfully migrated ${migrated} notes` 
        : 'No notes needed migration',
      total,
      migrated,
      needsMigration: 0
    };
  } catch (error) {
    console.error('Error migrating notes:', error);
    return {
      success: false,
      message: 'Failed to migrate notes',
      total: 0,
      migrated: 0,
      needsMigration: 0
    };
  }
}
