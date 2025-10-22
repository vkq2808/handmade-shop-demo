import { createContext, useState, useEffect } from "react";
import api from "../utils/customAxios.js";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setCurrentUser(res.data);
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchProfile(); // Kiểm tra xem có người dùng nào đang đăng nhập không
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
