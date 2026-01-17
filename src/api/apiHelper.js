import { supabase } from '../supabaseClient';

// Helper to get headers with the token automatically
export const getAuthHeaders = async () => {
    // 1. Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 2. Return the headers object
    return {
        'Content-Type': 'application/json',
        // If no token exists, this sends "Bearer undefined" which your backend will reject (correctly)
        'Authorization': token ? `Bearer ${token}` : '',
    };
};