import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeuhpekzdajcbijfpxcj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFldWhwZWt6ZGFqY2JpamZweGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODE5MjUsImV4cCI6MjA4MjY1NzkyNX0.84xdmZ74mps2ez55Z5dRMglX5pKvx_SoNOvxc1YB-Js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);