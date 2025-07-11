import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://pbjtlrgmaclqgjzpimaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBianRscmdtYWNscWdqenBpbWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxODIyMjYsImV4cCI6MjA2Nzc1ODIyNn0.l8qo8WBMSwnWSXCpUFqJhr41aDIgNKjLL2dTHum4NTc';

export const supabase = createClient(supabaseUrl, supabaseKey);