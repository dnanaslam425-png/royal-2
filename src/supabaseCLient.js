import { createClient } from '@supabase/supabase-js';

// ضع رابط المشروع الذي نسخته سابقاً
const supabaseUrl = 'https://jattoremocfznfeutmtr.supabase.co'; 

// ضع الـ Publishable Key الذي نسخته الآن
const supabaseAnonKey = 'sb_publishable_P04kQwEnjiUEAPqzHRtkmw_tcNljiZc'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);