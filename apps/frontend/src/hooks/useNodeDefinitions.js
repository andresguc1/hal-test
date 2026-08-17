import { useEffect, useRef } from "react";
import { api } from "../utils/api";
import { updateNodeDefinitions } from "../config/nodeConstants";

let _loaded = false;

export function useNodeDefinitions() {
  const loadedRef = useRef(_loaded);

  useEffect(() => {
    if (loadedRef.current) return;

    const fetchDefinitions = async () => {
      try {
        const [categoriesRes, definitionsRes] = await Promise.all([
          api.get("/nodes/categories"),
          api.get("/nodes/definitions"),
        ]);

        const categories = categoriesRes;
        const definitions = definitionsRes?.nodes || definitionsRes;

        if (categories && Object.keys(categories).length > 0) {
          updateNodeDefinitions(categories, definitions);
          _loaded = true;
          loadedRef.current = true;
        }
      } catch (err) {
        console.warn(
          "[useNodeDefinitions] Failed to fetch dynamic definitions, using static fallback:",
          err.message,
        );
      }
    };

    fetchDefinitions();
  }, []);
}
