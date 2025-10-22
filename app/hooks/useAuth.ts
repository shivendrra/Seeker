import { useState, useEffect } from 'react';
import { onAuthChange } from '../services/firebaseService';
import type { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      
      // A user who just signed up with email/password won't have a displayName
      // until they complete the profile setup step.
      if (firebaseUser && !firebaseUser.displayName) {
        setIsProfileIncomplete(true);
      } else {
        setIsProfileIncomplete(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isProfileIncomplete };
};
