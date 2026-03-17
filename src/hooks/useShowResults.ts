import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useShowResults(): { showResults: boolean; loading: boolean } {
  const { schoolId } = useAuth();
  const [showResults, setShowResults] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("show_results")
          .eq("school_code", schoolId)
          .maybeSingle();

        if (!error && data) {
          setShowResults(data.show_results);
        }
      } catch {
        // default to true on error
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, [schoolId]);

  return { showResults, loading };
}
