import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';
import { ChatSession, Message, UserProfileData, UserSettings, UserProfile, Trace, Source } from '../types';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signUpWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
}

export const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
}

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// User Profile Service
export const createUserProfile = async (user: User, profileData: UserProfileData) => {
    if (!user) return;
    
    // Update the user's auth profile (for displayName and photoURL)
    await updateProfile(user, {
        displayName: profileData.displayName,
    });

    // Create a document in the 'users' collection with additional info
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        displayName: profileData.displayName,
        email: user.email,
        profession: profileData.profession || '',
        description: profileData.description || '',
        settings: {
            defaultJurisdiction: '',
            defaultDocTypes: 'legal judgment, academic paper, news article',
            showTrace: true,
            defaultDateFilter: 'Any Time',
            defaultSummaryStyle: 'Key Points',
            enableMemory: true,
            language: 'English',
            theme: 'light',
        }
    });
};

export const getUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};

export const updateUserAccount = async (user: User, data: { displayName: string }) => {
    if (!user) throw new Error("User not authenticated.");

    // Update Firebase Auth profile
    await updateProfile(user, {
        displayName: data.displayName
    });

    // Update Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { displayName: data.displayName });
};

export const reauthenticateAndChangePassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not found or email is missing.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);

    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword);
};


export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { settings });
};


// Firestore Service
const sessionsCollection = collection(db, 'sessions');

export const createSession = async (userId:string): Promise<string> => {
    const sessionRef = await addDoc(sessionsCollection, {
        userId,
        title: 'New Research',
        createdAt: serverTimestamp(),
    });
    return sessionRef.id;
};

export const deleteSession = async (sessionId: string) => {
    if (!sessionId) return;
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        const messagesRef = collection(sessionRef, 'messages');

        // Delete all messages in the subcollection
        const messagesSnapshot = await getDocs(messagesRef);
        const batch = writeBatch(db);
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the session document itself
        await deleteDoc(sessionRef);
    } catch (error) {
        console.error("Error deleting session:", error);
        throw new Error("Failed to delete session.");
    }
};


export const getUserSessions = (userId: string, callback: (sessions: ChatSession[]) => void) => {
    const q = query(sessionsCollection, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatSession));
        
        sessions.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            if (a.createdAt) return -1;
            if (b.createdAt) return 1;
            return 0;
        });

        callback(sessions);
    });
};

export const getSessionMessages = (sessionId: string, callback: (messages: Message[]) => void) => {
    const messagesCollection = collection(db, `sessions/${sessionId}/messages`);
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
};


export const addMessageToSession = async (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const messagesCollection = collection(db, `sessions/${sessionId}/messages`);
    const messageData = {
        ...message,
        timestamp: serverTimestamp()
    };
    return await addDoc(messagesCollection, messageData);
};

export const updateMessageInSession = async (sessionId: string, messageId: string, newText: string) => {
    const messageRef = doc(db, `sessions/${sessionId}/messages`, messageId);
    await updateDoc(messageRef, { text: newText });
}

export const finalizeBotMessageInSession = async (sessionId: string, messageId: string, content: string, trace: Trace | null, sources: Source[] | null) => {
    const messageRef = doc(db, `sessions/${sessionId}/messages`, messageId);
    const finalData: any = { text: content };
    if (trace) {
        // Firebase cannot store `undefined` values, so we convert the trace object to a plain JSON object.
        finalData.trace = JSON.parse(JSON.stringify(trace));
    }
    if (sources) {
        finalData.sources = sources;
    }
    await updateDoc(messageRef, finalData);
}

export const updateSessionTitle = async (sessionId: string, title: string) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, { title });
};