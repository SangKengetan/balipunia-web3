import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RegisterPura from "./pages/RegisterPura";

// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRedirect from "./pages/admin/AdminRedirect";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import AdminPuraDashboard from "./pages/admin/AdminPuraDashboard";
import TrusteesDashboard from "./pages/admin/TrusteesDashboard";
import CampaignList from "./pages/admin/CampaignList";
import CreateCampaign from "./pages/admin/CreateCampaign";
import CampaignDetail from "./pages/admin/CampaignDetail";
import PublicCampaignList from "./pages/public/PublicCampaignList";
import PublicCampaignDetail from "./pages/public/PublicCampaignDetail";

// Route guard
import AdminProtectedRoute from "./components/ProtectedAdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================
            PUBLIC ROUTES
        ====================== */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPura />} />
        <Route path="/public/campaigns" element={<PublicCampaignList />} />
        <Route path="/campaigns/:id" element={<PublicCampaignDetail />}
/>


        {/* =====================
            ADMIN AUTH
        ====================== */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* =====================
            ADMIN ENTRY (REDIRECT)
        ====================== */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminRedirect />
            </AdminProtectedRoute>
          }
        />

        {/* =====================
            ROLE-BASED DASHBOARD
        ====================== */}
        <Route
          path="/admin/super"
          element={
            <AdminProtectedRoute allowed={["SUPER_ADMIN"]}>
              <SuperAdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/pura"
          element={
            <AdminProtectedRoute allowed={["ADMIN_PURA"]}>
              <AdminPuraDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/pura/campaigns"
          element={
            <AdminProtectedRoute allowed={["ADMIN_PURA"]}>
              <CampaignList />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/pura/campaigns/create"
          element={
            <AdminProtectedRoute allowed={["ADMIN_PURA"]}>
              <CreateCampaign />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/pura/campaigns/:id"
          element={
            <AdminProtectedRoute allowed={["ADMIN_PURA"]}>
              <CampaignDetail />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/trustees"
          element={
            <AdminProtectedRoute allowed={["TRUSTEES"]}>
              <TrusteesDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
