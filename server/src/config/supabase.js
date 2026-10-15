import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

let supabaseClient = null;
let supabaseAdminClient = null;

if (config.supabase.url && config.supabase.anonKey) {
  try {
    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey);
    console.log('[Supabase] Initialized client successfully');
  } catch (error) {
    console.error('[Supabase] Initialization failed:', error.message);
  }
}

if (config.supabase.url && config.supabase.serviceKey) {
  try {
    supabaseAdminClient = createClient(config.supabase.url, config.supabase.serviceKey);
    console.log('[Supabase] Initialized admin client successfully');
  } catch (error) {
    console.error('[Supabase] Admin client initialization failed:', error.message);
  }
}

export { supabaseClient, supabaseAdminClient };
