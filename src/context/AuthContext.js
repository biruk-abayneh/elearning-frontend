import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Your direct supabase web client

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (sessionUser) => {
        if (!sessionUser) {
            setUser(null);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', sessionUser.id)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
        }
        // Store the combined data in your state
        setUser({
            ...sessionUser,
            role: data?.role || 'user',
            full_name: data?.full_name || 'New Student'
        });
        setLoading(false);
    };

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchProfile(session?.user);
        });

        // Listen for changes (Login/Logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await fetchProfile(session?.user);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};