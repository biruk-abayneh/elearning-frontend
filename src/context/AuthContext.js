import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import * as Linking from 'expo-linking';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Helper to parse Google tokens from the URL
    const extractParamsFromUrl = (url) => {
        if (!url) return null;
        const regex = /[#&](access_token|refresh_token)=([^&]*)/g;
        let match;
        const params = {};
        while ((match = regex.exec(url))) {
            params[match[1]] = decodeURIComponent(match[2]);
        }
        return params;
    };

    // 2. Fetch Profile with Timeout Safety
    const fetchProfile = async (sessionUser, retries = 2) => {
        if (!sessionUser) {
            setUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        for (let i = 0; i < retries; i++) {
            try {
                console.log(`AuthContext: Fetching profile (Attempt ${i + 1})...`);

                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                const { data, error } = await Promise.race([
                    supabase.from('profiles').select('role, full_name').eq('id', sessionUser.id).single(),
                    timeout
                ]);

                if (error) throw error;

                // If we reach here, we succeeded!
                const completeUser = {
                    ...sessionUser,
                    role: data?.role || 'user',
                    full_name: data?.full_name || sessionUser.user_metadata?.full_name || 'Student'
                };

                setUser(completeUser);
                setLoading(false);
                return; // Exit the loop and function

            } catch (err) {
                console.warn(`Attempt ${i + 1} failed:`, err.message);
                if (i === retries - 1) {
                    // Last attempt failed, use fallback
                    setUser({
                        ...sessionUser,
                        role: 'user',
                        full_name: sessionUser.user_metadata?.full_name || 'Student'
                    });
                    setLoading(false);
                } else {
                    // Wait 1 second before retrying to let the network stabilize
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
        }
    };

    useEffect(() => {
        // 3. Handle Incoming Links (The Google Redirect)
        const handleDeepLink = async (url) => {
            const params = extractParamsFromUrl(url);
            if (params?.access_token && params?.refresh_token) {
                console.log("AuthContext: Deep link tokens found! Setting session...");
                const { error } = await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token,
                });
                if (error) console.error("SetSession Error:", error.message);
                // Note: setSession will trigger the onAuthStateChange listener below
                return true;
            }
            return false;
        };

        // 4. Initialize Auth Sequence
        const initializeAuth = async () => {
            // A. Check if app was opened by a URL (Google Redirect)
            const initialUrl = await Linking.getInitialURL();
            const hasUrlSession = await handleDeepLink(initialUrl);

            // B. If NO URL session, check for a standard cached session
            if (!hasUrlSession) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log("AuthContext: No session found. Ready for Login.");
                    setLoading(false);
                }
                // If session exists, onAuthStateChange handles it
            }
        };

        initializeAuth();

        // Listen for future links (while app is in background)
        const linkSubscription = Linking.addEventListener('url', (e) => handleDeepLink(e.url));

        // 5. Supabase Auth Listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth Event: ${event}`);

            if (session?.user) {
                // Only fetch if we haven't already set this specific user
                if (!user || user.id !== session.user.id) {
                    console.log("AuthContext: Fetching profile for user:", session);
                    await fetchProfile(session.user);
                }
            } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
                // Only turn off loading if we are truly empty
                if (!session) {
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            linkSubscription.remove();
            authListener.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};