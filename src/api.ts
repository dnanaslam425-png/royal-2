// src/api.ts
import { supabase } from './supabaseClient'; // تأكد من إنشاء هذا الملف

export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data;
};

export const saveProductToDB = async (product: any) => {
  const { data, error } = await supabase.from('products').upsert([product]);
  if (error) throw error;
  return data;
};