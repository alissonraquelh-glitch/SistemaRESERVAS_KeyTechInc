import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "../services/api/client";
import { useAgenda } from "../context/AgendaContext";

export function useApiQuery(route, query = {}, enabled = true) {
  const { revision } = useAgenda();
  const [state, setState] = useState({
    response: null,
    loading: enabled,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const serialized = JSON.stringify(query);
  useEffect(() => {
    const controller = new AbortController();
    if (!enabled) {
      setState({ response: null, loading: false, error: null });
      return () => controller.abort();
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    apiRequest(route, {
      queryParams: JSON.parse(serialized),
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted)
          setState({ response, loading: false, error: null });
      })
      .catch((error) => {
        if (error.name !== "AbortError" && !controller.signal.aborted)
          setState({ response: null, loading: false, error });
      });
    return () => controller.abort();
  }, [route, serialized, enabled, revision, nonce]);
  return { ...state, reload: useCallback(() => setNonce((n) => n + 1), []) };
}
