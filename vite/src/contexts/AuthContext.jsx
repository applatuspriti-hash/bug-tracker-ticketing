import { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { login as firebaseLogin, logout as firebaseLogout, subscribeToUserProfile, ensureAdminRole } from '../services/firebase';

import Loader from 'ui-component/Loader';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage to allow instant app load
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('berry_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // If we have a user in storage, we are somehow 'loaded' enough to show structure
    // But we still wait for Firebase to confirm validation
    // To solve "Data not showing", we can treat it as loaded if we have user
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        let profileUnsubscribe;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Subscribe to real-time profile updates
                profileUnsubscribe = subscribeToUserProfile(firebaseUser.uid, async (profile) => {
                    let updatedUser;
                    if (profile) {
                        // Checks for admin role
                        if (firebaseUser.email === 'info@applatus.com' && profile.role !== 'admin') {
                            await ensureAdminRole(firebaseUser.uid, firebaseUser.email);
                        }
                        updatedUser = { ...firebaseUser, ...profile };
                    } else {
                        updatedUser = firebaseUser;
                        // Auto-create logic if needed
                    }

                    // Sync to State and Storage    
                    setUser(updatedUser);
                    localStorage.setItem('berry_user', JSON.stringify(updatedUser));
                    setLoading(false);
                });
            } else {
                // Logged out
                setUser(null);
                localStorage.removeItem('berry_user');
                setLoading(false);
                if (profileUnsubscribe) profileUnsubscribe();
            }
        });

        return () => {
            unsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        await firebaseLogin(email, password);
        // State update handled by onAuthStateChanged
    };

    const logout = async () => {
        await firebaseLogout();
        localStorage.removeItem('berry_user');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin' || user?.email === 'info@applatus.com';

    if (loading) return <Loader />;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
