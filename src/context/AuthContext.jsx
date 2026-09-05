import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId, userMetadata = null) => {
    try {
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      // Si no existe perfil (ej. nuevo usuario que entra por Google OAuth)
      if (!data && userMetadata) {
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const googleName = userMetadata.full_name || userMetadata.name || userMetadata.user_name || 'Usuario';
        const newProfile = {
          owner_id: userId,
          profile_name: googleName,
          saizu_id: `SAI-${randomHex}`
        };
        const { data: created, error: insertError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (!insertError && created) {
          data = created;
        }
      }

      if (data) {
        let updates = {};
        if (!data.saizu_id) {
          const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
          updates.saizu_id = `SAI-${randomHex}`;
          data.saizu_id = updates.saizu_id;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('user_profiles').update(updates).eq('owner_id', userId);
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id, session.user.user_metadata).then(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update profile from components (e.g. after onboarding completion)
  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id, session.user.user_metadata);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
