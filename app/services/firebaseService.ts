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
} from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';
import { ChatSession, Message, UserProfileData } from '../types';


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
    });
};


// Firestore Service
const sessionsCollection = collection(db, 'sessions');

export const createSession = async (userId: string): Promise<string> => {
    const sessionRef = await addDoc(sessionsCollection, {
        userId,
        title: 'New Research',
        createdAt: serverTimestamp(),
    });
    return sessionRef.id;
};

export const getUserSessions = (userId: string, callback: (sessions: ChatSession[]) => void) => {
    const q = query(sessionsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatSession));
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


export const updateSessionTitle = async (sessionId: string, title: string) => {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, { title });
};
