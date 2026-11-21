import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { useAuth } from "./auth.js";

// Użycie w formularzu profilu i w kalkulatorach (kalkulatory są publiczne,
// więc dla niezalogowanego profile === null - kalkulator działa po staremu):
//   const { profile } = useProfile();
//   profile?.ubezpieczony.podstawaWymiaru
// Profil ma zawsze komplet pól (puste = "" / null).
// Pełny PESEL użytkownika nie trafia do frontendu - jest tylko ubezpieczony.peselMasked.
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    api("/api/profile")
      .then((d) => {
        if (!alive) return;
        setProfile(d.profile);
        setUpdatedAt(d.updatedAt);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  // Zwraca { ok: true } albo { ok: false, errors: { "platnik.nip": "..." } }
  const save = useCallback(async (next) => {
    try {
      const d = await api("/api/profile", { method: "PUT", body: next });
      if (!d.ok) return { ok: false, errors: d.errors ?? {} };
      setProfile(d.profile);
      setUpdatedAt(d.updatedAt);
      return { ok: true };
    } catch (err) {
      return { ok: false, errors: { _: err.message } };
    }
  }, []);

  return { profile, updatedAt, loading, save };
}
