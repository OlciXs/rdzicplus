import { createContext, useContext } from "react";

// Stan logowania współdzielony przez wszystkie trasy.
export const AuthContext = createContext({
  user: null,
  loading: true,
  error: "",
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
