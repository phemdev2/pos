// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface Branch { id: string; name: string; }
interface Profile { id: string; full_name: string; role: string; company_id: string; }

interface AuthState {
  user: any | null;
  profile: Profile | null;
  branches: Branch[];
  activeBranchId: string | null;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<string | null>;
  registerCompany: (companyName: string, branchName: string, name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setActiveBranch: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      branches: [],
      activeBranchId: null,
      isLoading: true,

      login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        
        // Check if profile exists before letting them in
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', (await supabase.auth.getUser()).data.user?.id).single();
        
        if (!profile) {
          await supabase.auth.signOut(); // Kick them out
          return "Account setup incomplete. Please register again."; // This shows in the red box on the login screen!
        }

        await get().fetchProfile();
        return null;
      },

               registerCompany: async (companyName, branchName, name, email, password) => {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) return authError.message;
        if (!authData.user || !authData.session) return "Failed to create user session. Is email confirmation turned off?";

        try {
          // 2. Create Company
          const { data: company, error: compError } = await supabase.from('companies').insert({ name: companyName }).select('id').single();
          if (compError) throw new Error(compError.message);

          // 3. Create Profile
          const { error: profileError } = await supabase.from('profiles').insert({ id: authData.user.id, company_id: company.id, full_name: name, role: 'admin' });
          if (profileError) throw new Error(profileError.message);

          // 4. Create Branch
          const { data: branch, error: branchError } = await supabase.from('branches').insert({ company_id: company.id, name: branchName }).select('id').single();
          if (branchError) throw new Error(branchError.message);

          set({ activeBranchId: branch.id });
          return null; // Success!

        } catch (setupError: any) {
          // CRITICAL FIX: If company/profile creation fails, delete the auth user so they don't become a ghost!
          console.error("Setup failed, deleting user:", setupError.message);
          await supabase.auth.signOut();
          
          // Call Supabase Admin API to fully delete the user from Auth
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${authData.user.id}`, {
            method: 'DELETE',
            headers: { 
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Content-Type': 'application/json'
            }
          });

          return `Setup failed: ${setupError.message}`;
        }
      },
      
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, branches: [], activeBranchId: null });
      },

            fetchProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { set({ isLoading: false }); return; }

        set({ user });
        
        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
              // SAFETY CHECK: If profile doesn't exist, log them out
        if (!profile) {
          console.error("Profile missing for this user. This usually means registration failed halfway. Please delete this user in Supabase Auth and Register again.");
          await supabase.auth.signOut();
          set({ user: null, profile: null, branches: [], activeBranchId: null, isLoading: false });
          return;
        }

        // Fetch Branches
        const { data: branches } = await supabase.from('branches').select('id, name').eq('company_id', profile.company_id);

        set({ 
          profile, 
          branches: branches || [], 
          // If they only have one branch, auto-select it
          activeBranchId: get().activeBranchId || (branches && branches.length > 0 ? branches[0].id : null),
          isLoading: false 
        });
      },

      setActiveBranch: (id) => set({ activeBranchId: id })
    }),
    {
      name: 'pos-auth-storage',
      partialize: (state) => ({ activeBranchId: state.activeBranchId }) // Only persist branch selection
    }
  )
);