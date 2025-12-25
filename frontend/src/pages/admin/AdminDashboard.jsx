import { useEffect, useState } from "react";
import useAdminAuth from "../../hooks/useAdminAuth";
import { adminMe } from "../../services/adminApi";

export default function AdminDashboard() {
  const { token, role, wallet, logoutAdmin } = useAdminAuth();
  const [me, setMe] = useState(null);

  useEffect(() => {
    adminMe(token).then(setMe).catch(() => logoutAdmin());
  }, [token]);

  return (
    <div className="p-6">
      <h1>Dashboard Admin</h1>
      <p>Wallet: {wallet}</p>
      <p>Role: {role}</p>
      <pre>{JSON.stringify(me, null, 2)}</pre>
      <button onClick={logoutAdmin}>Logout</button>
    </div>
  );
}
