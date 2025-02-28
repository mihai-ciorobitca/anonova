import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface UserData {
  credits: number;
  has_used_free_credits: boolean;
  plan_id: string | null;
}

interface UserContextType {
  credits: number;
  setCredits: (credits: number) => void;
  hasUsedFreeCredits: boolean;
  setHasUsedFreeCredits: (value: boolean) => void;
  refreshCredits: () => Promise<void>;
  updateUserCredits: (change: number) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [hasUsedFreeCredits, setHasUsedFreeCredits] = useState(false);

  const handleUpdateUserCredits = async (change: number) => {
    if (!user) return;

    // Validate credit change
    if (change < 0 && Math.abs(change) > credits) {
      throw new Error('Insufficient credits available');
    }

    try {
      const { data, error } = await supabase.rpc('update_user_credits', {
        user_id: user.id,
        credit_change: change
      });

      if (error) throw error;

      setCredits(data);
    } catch (err) {
      console.error('Error updating credits:', err);
      throw err;
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits, has_used_free_credits, plan_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const userData = data as UserData;
      setCredits(userData.credits);
      setHasUsedFreeCredits(userData.has_used_free_credits);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const refreshCredits = async () => {
    if (!user) return;

    try {
      await fetchUserData();
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  useEffect(() => {
    if (user) {
      // Initial fetch
      const fetchInitialCredits = async () => {
        await fetchUserData();
        setLoading(false);
      };

      fetchInitialCredits();

      // Set up real-time subscription
      const subscription = supabase
        .channel('credits_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`
          },
          async (payload) => {
            const newData = payload.new;
            if (payload.new) {
              fetchUserData();
              setHasUsedFreeCredits(newData.has_used_free_credits);
              setLoading(false);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setCredits(0);
      setHasUsedFreeCredits(false);
      setLoading(false);
    }
  }, [user?.id]);

  return (
    <UserContext.Provider value={{
      credits,
      setCredits,
      hasUsedFreeCredits,
      updateUserCredits: handleUpdateUserCredits,
      setHasUsedFreeCredits,
      refreshCredits,
      loading
    }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};


export { useUser }