import { Navigate } from "react-router-dom";
import useDonorAuth from "../hooks/useDonorAuth";

export default function ProtectedDonorRoute({ children }) {
  const { isDonorAuthenticated } = useDonorAuth();

  if (!isDonorAuthenticated) {
    return <Navigate to="/donor/login" replace />;
  }

  return children;
}
