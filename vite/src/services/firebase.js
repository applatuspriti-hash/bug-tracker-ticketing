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
    getDoc
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import { auth, db, storage } from "../firebase-config";
import { firebaseConfig } from "../firebase-config";

// --- AUTH SERVICES ---

export const signup = async (email, password, name, role = 'user') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role, // 'admin' or 'user'
        avatar: '', // Optional
        createdAt: new Date().toISOString()
    });

    return user;
};




export const ensureAdminRole = async (uid, email) => {
    // Force write role='admin' to Firestore if it's the super admin
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
        uid,
        email,
        name: 'Admin', // Default name
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

// Real-time listener for tickets
export const subscribeToTickets = (callback) => {
    const q = query(collection(db, "tickets"));
    return onSnapshot(q, (querySnapshot) => {
        const tickets = [];
        querySnapshot.forEach((doc) => {
            tickets.push({ id: doc.id, ...doc.data() });
        });
        console.log("Fetched Tickets:", tickets);
        callback(tickets);
    }, (error) => {
        console.error("Error subscribing to tickets:", error);
    });
};

// Real-time listener for users
export const subscribeToUsers = (callback) => {
    const q = query(collection(db, "users"));
    return onSnapshot(q, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        console.log("Fetched Users:", users);
        callback(users);
    }, (error) => {
        console.error("Error subscribing to users:", error);
    });
};

// Real-time listener for user profile
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
    let data = {};
    if (typeof nameOrData === 'object') {
        data = { ...nameOrData };
    } else {
        data = { name: nameOrData };
    }

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

// --- STORAGE SERVICES ---

export const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// --- PAGINATION SERVICES ---

import { startAfter, limit, where, orderBy, getDocs, getCountFromServer } from "firebase/firestore";

/**
 * Fetch paginated data from Firestore
 * 
 * Strategy:
 * Since we need "Page Jump" functionality (Page 1 -> Page 5) and Firestore doesn't support 
 * 'offset' efficiently or in all SDK versions, we use a hybrid approach.
 * We fetch (pageIndex + 1) * pageSize items and return the last 'pageSize' items.
 * For typical Admin Dashboard use cases where users rarely go beyond page 10, this is acceptable.
 * 
 * @param {string} collectionName 
 * @param {Object} options 
 */
export const getPaginatedData = async (collectionName, {
    pageSize = 10,
    pageIndex = 0,
    filters = [],
    orderByField = 'createdAt',
    orderDirection = 'desc'
} = {}) => {

    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    // Apply Filters
    filters.forEach(filter => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
        }
    });

    // Apply Sorting
    q = query(q, orderBy(orderByField, orderDirection));

    // Apply Pagination (Limit Strategy for Random Access)
    // We fetch all items up to the end of the requested page
    const limitCount = (pageIndex + 1) * pageSize;
    q = query(q, limit(limitCount));

    const snapshot = await getDocs(q);
    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If we are on page 0, return all (which is just pageSize)
    if (pageIndex === 0) {
        return allDocs;
    }

    // For page > 0, we slice the last 'pageSize' items
    const startIndex = pageIndex * pageSize;
    // If we don't have enough items to fill previous pages, we return empty or partial
    if (allDocs.length <= startIndex) {
        return [];
    }

    return allDocs.slice(startIndex, startIndex + pageSize);
};

export const getCount = async (collectionName, filters = []) => {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    // Apply Filters
    filters.forEach(filter => {
        if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
            q = query(q, where(filter.field, filter.operator, filter.value));
        }
    });

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
};

