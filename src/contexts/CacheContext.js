import React, { createContext, useContext, useRef } from "react";

// Create a context for cache
const CacheContext = createContext(null);

export const useCache = () => {
  return useContext(CacheContext);
};

// CacheProvider component that wraps your application
export const CacheProvider = ({ children }) => {
  const cacheRef = useRef({
    group: null,
    members: {},
    tasks: {},
  });

  return (
    <CacheContext.Provider value={cacheRef.current}>
      {children}
    </CacheContext.Provider>
  );
};
