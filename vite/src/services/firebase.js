import { initializeApp } from "firebase/app";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    getAuth
} from "firebase/auth";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    query,
    onSnapshot,
    setDoc,
    getDoc,
    orderBy,
    startAfter,
    limit,
    where,
    getDocs,
    getCountFromServer
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import { getToken, onMessage } from "firebase/messaging";
import { auth, db, storage, messaging, firebaseConfig } from "../firebase-config";

// --- MESSAGING SERVICES ---

export const requestForToken = async (userId) => {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: 'BCzb_UsU23d-Ls9Y1MRrxYjwwBXrYlgWl9KuT94OFCLiAUkGWUNCdIiSmXN2sLaUg6JWB4n-PtzsgX5IlPWUDBs' // You might need a VAPID key here, or leave it blank if using default config
        });

        if (currentToken && userId) {
            // Save token to database
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                fcmToken: currentToken
            });
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = (callback) => {
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};


// --- AUTH SERVICES ---

export const signup = async (email, password, name, role = 'user') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        avatar: '',
        createdAt: new Date().toISOString()
    });

    return user;
};

export const ensureAdminRole = async (uid, email) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
        uid,
        email,
        name: 'Admin',
        role: 'admin',
        updatedAt: new Date().toISOString()
    }, { merge: true });
};

export const createSecondaryUser = async (email, password, name, role = 'user') => {
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
        const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = result.user;
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            role,
            avatar: '',
            createdAt: new Date().toISOString()
        });
        await signOut(secondaryAuth);
        return user;
    } catch (error) {
        throw error;
    }
};

export const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
    return signOut(auth);
};

export const getUserProfile = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return null;
    }
};

// --- DATA SERVICES (TICKETS) ---

export const subscribeToTickets = (callback) => {
    const q = query(collection(db, "tickets"));
    return onSnapshot(q, (querySnapshot) => {
        const tickets = [];
        querySnapshot.forEach((doc) => {
            tickets.push({ id: doc.id, ...doc.data() });
        });
        callback(tickets);
    }, (error) => {
        console.error("Error subscribing to tickets:", error);
    });
};

export const subscribeToUsers = (callback) => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        callback(users);
    }, (error) => {
        console.error("Error subscribing to users:", error);
    });
};

export const subscribeToUserProfile = (uid, callback) => {
    return onSnapshot(doc(db, "users", uid), (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
};

// --- SUPER BOARD SERVICES ---

export const createSuperBoard = async (nameOrData, createdBy) => {
    let data = typeof nameOrData === 'object' ? { ...nameOrData } : { name: nameOrData };
    return await addDoc(collection(db, "superBoards"), {
        ...data,
        createdBy,
        createdAt: new Date().toISOString()
    });
};

export const subscribeToSuperBoards = (callback) => {
    const q = query(collection(db, "superBoards"));
    return onSnapshot(q, (querySnapshot) => {
        const boards = [];
        querySnapshot.forEach((doc) => {
            boards.push({ id: doc.id, ...doc.data() });
        });
        callback(boards);
    }, (error) => {
        console.error("Error subscribing to super boards:", error);
    });
};

export const updateSuperBoard = async (boardId, updates) => {
    const boardRef = doc(db, "superBoards", boardId);
    await updateDoc(boardRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

export const deleteSuperBoard = async (boardId) => {
    await deleteDoc(doc(db, "superBoards", boardId));
};

// --- USER MANAGEMENT SERVICES ---

export const updateUser = async (userId, updates) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

export const deleteUser = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
};

export const createTicket = async (ticketData) => {
    return await addDoc(collection(db, "tickets"), {
        ...ticketData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
};

export const updateTicket = async (ticketId, updates) => {
    const ticketRef = doc(db, "tickets", ticketId);
    await updateDoc(ticketRef, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

export const deleteTicket = async (ticketId) => {
    await deleteDoc(doc(db, "tickets", ticketId));
};

// --- STORAGE SERVICES ---

export const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

export const uploadFile = uploadImage;

// --- PAGINATION SERVICES ---

export const getPaginatedData = async (collectionName, {
    pageSize = 10,
    pageIndex = 0,
    filters = [],
    orderByField = 'createdAt',
    orderDirection = 'desc'
} = {}) => {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    filters.forEach(filter => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
        }
    });

    q = query(q, orderBy(orderByField, orderDirection));
    const limitCount = (pageIndex + 1) * pageSize;
    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (pageIndex === 0) return allDocs;

    const startIndex = pageIndex * pageSize;
    if (allDocs.length <= startIndex) return [];

    return allDocs.slice(startIndex, startIndex + pageSize);
};

export const getCount = async (collectionName, filters = []) => {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);
    filters.forEach(filter => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
        }
    });
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
};

// --- CHAT SERVICES ---

export const sendChatMessage = async (text, user, media = null) => {
    if ((!text && !media) || !user) return;


    // 2. Save message to Firestore
    await addDoc(collection(db, "chat_messages"), {
        text: text || '',
        media: media || null,
        senderId: user.uid,
        senderName: user.name || 'Unknown',
        senderAvatar: user.avatar || '',
        createdAt: new Date().toISOString(),
        readBy: [user.uid]
    });
};

export const subscribeToChatMessages = (callback) => {
    const q = query(collection(db, "chat_messages"), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
    }, (error) => {
        console.error("Error subscribing to chat:", error);
    });
};

export const markMessageAsRead = async (messageId, userId) => {
    const { arrayUnion } = await import("firebase/firestore");
    const messageRef = doc(db, "chat_messages", messageId);
    await updateDoc(messageRef, {
        readBy: arrayUnion(userId)
    });
};

export const markAllMessagesAsRead = async (messages, userId) => {
    const { arrayUnion, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    let updateCount = 0;

    messages.forEach(msg => {
        if (!msg.readBy?.includes(userId)) {
            const msgRef = doc(db, "chat_messages", msg.id);
            batch.update(msgRef, {
                readBy: arrayUnion(userId)
            });
            updateCount++;
        }
    });

    if (updateCount > 0) await batch.commit();
};

export const setTypingStatus = async (user, isTyping) => {
    if (!user) return;
    const typingRef = doc(db, "chat_typing", user.uid);
    if (isTyping) {
        await setDoc(typingRef, {
            uid: user.uid,
            name: user.name || 'Unknown',
            isTyping: true,
            updatedAt: new Date().toISOString()
        });
    } else {
        await deleteDoc(typingRef);
    }
};

export const subscribeToTypingStatus = (callback) => {
    const q = query(collection(db, "chat_typing"));
    return onSnapshot(q, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const diff = new Date() - new Date(data.updatedAt);
            if (diff < 10000) typingUsers.push(data);
        });
        callback(typingUsers);
    });
};
