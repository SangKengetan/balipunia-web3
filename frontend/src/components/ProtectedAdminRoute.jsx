import { Navigate } from "react-router-dom";
import useAdminAuth from "../hooks/useAdminAuth";

export default function ProtectedAdminRoute({ children, allowed }) {
  const { isAuthenticated, role } = useAdminAuth();

  // 1️⃣ Belum login → ke login admin
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // 2️⃣ Login tapi role tidak sesuai
  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  // 3️⃣ Aman
  return children;
}
