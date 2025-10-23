// Fix: Switched to Firebase v9 compatibility API to resolve module export errors.
// This involves using the namespaced `firebase` object instead of modular functions.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { firebaseConfig } from '../firebaseConfig';
import { ChatSession, Message, UserProfileData, UserSettings, UserProfile, Trace, Source, User } from '../types';

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

const googleProvider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = () => {
  return auth.signInWithPopup(googleProvider);
};

export const signUpWithEmail = (email, password) => {
    return auth.createUserWithEmailAndPassword(email, password);
}

export const signInWithEmail = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
}

export const logout = () => {
  return auth.signOut();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// User Profile Service
export const createUserProfile = async (user: User, profileData: UserProfileData) => {
    if (!user) return;
    
    // Update the user's auth profile (for displayName and photoURL)
    await user.updateProfile({
        displayName: profileData.displayName,
    });

    // Create a document in the 'users' collection with additional info
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
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
    const userRef = db.collection('users').doc(userId);
    return userRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
            callback(docSnap.data() as UserProfile);
        } else {
            callback(null);
        }
    });
};

export const updateUserAccount = async (user: User, data: { displayName: string, profession?: string, description?: string }) => {
    if (!user) throw new Error("User not authenticated.");

    // Update Firebase Auth profile
    if (user.displayName !== data.displayName) {
        await user.updateProfile({
            displayName: data.displayName
        });
    }

    // Update Firestore user document
    const userRef = db.collection('users').doc(user.uid);
    const firestoreData: Partial<UserProfileData> = {
        displayName: data.displayName,
        profession: data.profession || '',
        description: data.description || '',
    };
    await userRef.update(firestoreData);
};

export const reauthenticateAndChangePassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not found or email is missing.");

    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);

    // Re-authenticate the user
    await user.reauthenticateWithCredential(credential);

    // If re-authentication is successful, update the password
    await user.updatePassword(newPassword);
};


export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ settings });
};


// Firestore Service
const sessionsCollectionRef = db.collection('sessions');

export const createSession = async (userId:string): Promise<string> => {
    const sessionRef = await sessionsCollectionRef.add({
        userId,
        title: 'New Research',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return sessionRef.id;
};

export const deleteSession = async (sessionId: string) => {
    if (!sessionId) return;
    try {
        const sessionRef = db.collection('sessions').doc(sessionId);
        const messagesRef = sessionRef.collection('messages');

        // Delete all messages in the subcollection
        const messagesSnapshot = await messagesRef.get();
        const batch = db.batch();
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the session document itself
        await sessionRef.delete();
    } catch (error) {
        console.error("Error deleting session:", error);
        throw new Error("Failed to delete session.");
    }
};


export const getUserSessions = (userId: string, callback: (sessions: ChatSession[]) => void) => {
    const q = sessionsCollectionRef.where('userId', '==', userId);
    return q.onSnapshot((snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatSession));
        
        sessions.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                // @ts-ignore
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
             // @ts-ignore
            if (a.createdAt) return -1;
             // @ts-ignore
            if (b.createdAt) return 1;
            return 0;
        });

        callback(sessions);
    });
};

export const getSessionMessages = (sessionId: string, callback: (messages: Message[]) => void) => {
    const messagesCollectionRef = db.collection(`sessions/${sessionId}/messages`);
    const q = messagesCollectionRef.orderBy('timestamp', 'asc');
    return q.onSnapshot((snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
};


export const addMessageToSession = async (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const messagesCollectionRef = db.collection(`sessions/${sessionId}/messages`);
    const messageData = {
        ...message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    return await messagesCollectionRef.add(messageData);
};

export const updateMessageInSession = async (sessionId: string, messageId: string, newText: string) => {
    const messageRef = db.collection(`sessions/${sessionId}/messages`).doc(messageId);
    await messageRef.update({ text: newText });
}

export const finalizeBotMessageInSession = async (sessionId: string, messageId: string, content: string, trace: Trace | null, sources: Source[] | null) => {
    const messageRef = db.collection(`sessions/${sessionId}/messages`).doc(messageId);
    const finalData: any = { text: content };
    if (trace) {
        // Firebase cannot store `undefined` values, so we convert the trace object to a plain JSON object.
        finalData.trace = JSON.parse(JSON.stringify(trace));
    }
    if (sources) {
        finalData.sources = sources;
    }
    await messageRef.update(finalData);
}

export const updateSessionTitle = async (sessionId: string, title: string) => {
    const sessionRef = db.collection('sessions').doc(sessionId);
    await sessionRef.update({ title });
};