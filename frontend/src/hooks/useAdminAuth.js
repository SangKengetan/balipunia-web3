import { useState } from "react";

export default function useAdminAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token"));
  const [role, setRole] = useState(() => sessionStorage.getItem("admin_role"));
  const [wallet, setWallet] = useState(() => sessionStorage.getItem("admin_wallet"));

  const loginAdmin = ({ token, role, address }) => {
    sessionStorage.setItem("admin_token", token);
    sessionStorage.setItem("admin_role", role);
    sessionStorage.setItem("admin_wallet", address);
    setToken(token);
    setRole(role);
    setWallet(address);
  };

  const logoutAdmin = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_role");
    sessionStorage.removeItem("admin_wallet");
    setToken(null);
    setRole(null);
    setWallet(null);
  };

  return {
    token,
    role,
    wallet,
    isAuthenticated: !!token,
    loginAdmin,
    logoutAdmin,
  };
}
