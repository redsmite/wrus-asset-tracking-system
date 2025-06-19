// This line MUST be exactly as shown — +esm makes it browser-compatible
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://vkffjcptpznbidjnubqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZmZqY3B0cHpuYmlkam51YnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTI1NzMsImV4cCI6MjA2NTg2ODU3M30.1b8FY6YqOudijYRxRUtIRzvQ2Jfd6_4kP2j9P6iU6wI';

export const supabase = createClient(supabaseUrl, supabaseKey);