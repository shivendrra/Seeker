
import { useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from '../services/firebaseService';
import type { User, UserProfile } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthChange((firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        unsubscribeProfile = getUserProfile(firebaseUser.uid, (profile) => {
          setUserProfile(profile);
          if (profile) {
            setIsProfileIncomplete(!profile.displayName);
          } else {
            setIsProfileIncomplete(true);
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setIsProfileIncomplete(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return { user, userProfile, loading, isProfileIncomplete };
};
