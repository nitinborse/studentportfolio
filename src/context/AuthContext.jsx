// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../services/supabase";

// const AuthContext = createContext(null);
// const AUTH_USER_KEY = "auth_user";
// const AUTH_PROFILE_KEY = "auth_profile";

// function readStorage(key) {
//   try {
//     const raw = localStorage.getItem(key);
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

// function writeStorage(key, value) {
//   try {
//     if (value == null) localStorage.removeItem(key);
//     else localStorage.setItem(key, JSON.stringify(value));
//   } catch {
//     // Ignore storage errors (private mode/quota)
//   }
// }

// function clearSupabaseAuthStorage() {
//   try {
//     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//     const projectRef = supabaseUrl ? new URL(supabaseUrl).host.split(".")[0] : null;
//     if (!projectRef) return;
//     localStorage.removeItem(`sb-${projectRef}-auth-token`);
//   } catch {
//     // Ignore storage parsing/removal errors
//   }
// }

// export function AuthProvider({ children }) {
//   const cachedUser = readStorage(AUTH_USER_KEY);
//   const cachedProfile = readStorage(AUTH_PROFILE_KEY);

//   const [user, setUser] = useState(() => cachedUser);
//   const [profile, setProfile] = useState(() => cachedProfile);
//   const [loading, setLoading] = useState(true);

//   function withTimeout(promise, ms = 10000) {
//     return Promise.race([
//       promise,
//       new Promise((_, reject) => {
//         setTimeout(() => reject(new Error("Auth request timed out.")), ms);
//       }),
//     ]);
//   }

//   async function fetchProfile(uid) {
//     const { data, error } = await supabase
//       .from("profiles")
//       .select("id, full_name, role, school_id")
//       .eq("id", uid)
//       .single();

//     if (error) throw error;
//     return data;
//   }

//   function clearLocalAuthCache() {
//     setUser(null);
//     setProfile(null);
//     writeStorage(AUTH_USER_KEY, null);
//     writeStorage(AUTH_PROFILE_KEY, null);
//   }

//   async function syncAuthState(sessionUser) {
//     setUser(sessionUser);
//     if (!sessionUser) {
//       setProfile(null);
//       return;
//     }
//     const prof = await withTimeout(fetchProfile(sessionUser.id));
//     setProfile(prof);
//   }

//   useEffect(() => {
//     let alive = true;

//     const load = async () => {
//       if (alive) setLoading(true);
//       try {
//         const { data, error } = await withTimeout(supabase.auth.getUser());
//         if (error) throw error;
//         const sessionUser = data?.user ?? null;

//         if (!alive) return;
//         await syncAuthState(sessionUser);
//       } catch {
//         if (alive) {
//           clearLocalAuthCache();
//         }
//       } finally {
//         if (alive) setLoading(false);
//       }
//     };

//     load();

//     const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
//       if (!alive) return;

//       setTimeout(async () => {
//         if (!alive) return;
//         setLoading(true);
//         try {
//           const sessionUser = session?.user ?? null;
//           await syncAuthState(sessionUser);
//         } catch {
//           clearLocalAuthCache();
//         } finally {
//           if (alive) setLoading(false);
//         }
//       }, 0);
//     });

//     return () => {
//       alive = false;
//       sub?.subscription?.unsubscribe?.();
//     };
//   }, []);

//   const login = async (email, password) => {
//     setLoading(true);
//     try {
//       const { data, error } = await withTimeout(
//         supabase.auth.signInWithPassword({ email, password })
//       );
//       if (error) throw error;

//       const sessionUser = data?.user ?? data?.session?.user ?? null;
//       if (!sessionUser) throw new Error("Login succeeded but user session is missing.");

//       await syncAuthState(sessionUser);

//       return data;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     clearLocalAuthCache();
//     clearSupabaseAuthStorage();

//     try {
//       await supabase.auth.signOut({ scope: "local" });
//     } catch {
//       // Local state is already cleared; ignore network/logout sync failures.
//     }
//   };

//   useEffect(() => {
//     writeStorage(AUTH_USER_KEY, user);
//   }, [user]);

//   useEffect(() => {
//     writeStorage(AUTH_PROFILE_KEY, profile);
//   }, [profile]);

//   return (
//     <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);
const AUTH_USER_KEY = "auth_user";
const AUTH_PROFILE_KEY = "auth_profile";

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage write error:', error);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage(AUTH_USER_KEY));
  const [profile, setProfile] = useState(() => readStorage(AUTH_PROFILE_KEY));
  const [loading, setLoading] = useState(true);

  function withTimeout(promise, ms = 10000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), ms)),
    ]);
  }

  async function fetchProfile(uid) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, school_id")
      .eq("id", uid)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Profile not found or blocked by RLS policy.");
    return data;
  }

  async function syncAuthState(sessionUser) {
    setUser(sessionUser);
    if (!sessionUser) {
      setProfile(null);
      return;
    }
    const prof = await withTimeout(fetchProfile(sessionUser.id));
    setProfile(prof);
  }

  function clearLocalAuth() {
    setUser(null);
    setProfile(null);
    writeStorage(AUTH_USER_KEY, null);
    writeStorage(AUTH_PROFILE_KEY, null);
  }

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (alive) setLoading(true);
      try {
        const { data, error } = await withTimeout(supabase.auth.getUser());
        if (error) throw error;
        const sessionUser = data?.user ?? null;
        if (!alive) return;
        await syncAuthState(sessionUser);
      } catch {
        // On initial boot only clear auth if we have no cached session.
        if (alive && !user) clearLocalAuth();
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;

      // Explicit sign-out should always clear local auth state.
      if (event === "SIGNED_OUT") {
        clearLocalAuth();
        return;
      }

      const sessionUser = session?.user ?? null;
      if (!sessionUser) return;

      // Background token refresh/focus events should not block UI.
      setUser(sessionUser);

      try {
        await syncAuthState(sessionUser);
      } catch {
        // Keep current state on transient refresh/profile fetch failures.
      }
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => writeStorage(AUTH_USER_KEY, user), [user]);
  useEffect(() => writeStorage(AUTH_PROFILE_KEY, profile), [profile]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      );
      if (error) throw error;
      await syncAuthState(data?.user ?? data?.session?.user ?? null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    clearLocalAuth();
    await supabase.auth.signOut({ scope: "local" });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
