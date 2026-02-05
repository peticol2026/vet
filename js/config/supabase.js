import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://vyxbktygvxvaewovvjoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eGJrdHlndnh2YWV3b3Z2am9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg0MzksImV4cCI6MjA4NDc1NDQzOX0.n-sSRgIhvUET55bRYahyt2c1G-oiC32eIQ5_cD0MBuk";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
