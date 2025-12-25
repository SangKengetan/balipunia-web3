import { Navigate } from "react-router-dom";
import useAdminAuth from "../../hooks/useAdminAuth";

export default function AdminRedirect() {
  const { role } = useAdminAuth();

  if (!role) return <Navigate to="/admin/login" replace />;

  switch (role) {
    case "SUPER_ADMIN":
      return <Navigate to="/admin/super" replace />;
    case "ADMIN_PURA":
      return <Navigate to="/admin/pura" replace />;
    case "TRUSTEES":
      return <Navigate to="/admin/trustees" replace />;
    default:
      return <Navigate to="/admin/login" replace />;
  }
}
