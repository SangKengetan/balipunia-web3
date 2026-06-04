import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RegisterPura from "./pages/RegisterPura";

// Admin
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRedirect from "./pages/admin/AdminRedirect";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import AdminPuraLayout from "./components/adminpura/AdminPura";
import Dashboard from "./pages/super-admin/Dashboard";
import AdminManagement from "./pages/super-admin/AdminManagement";
import FAQManagement from "./pages/super-admin/FAQManagement";
import Reports from "./pages/super-admin/Report";
import OffchainWithdrawals from "./pages/super-admin/OffchainWithdrawals";
import WithdrawTransfers from "./pages/super-admin/WithdrawTransfers";
import SuperAdminWithdrawDetail from "./pages/super-admin/SuperAdminWithdrawDetail";
import CampaignList from "./pages/adminpura/CampaignList";
import CampaignCreate from "./pages/adminpura/CampaignCreate";
import CampaignDetail from "./pages/adminpura/CampaignDetail";
import Profile from "./pages/adminpura/Profile";
import DashboardPura from "./pages/adminpura/Dashboard";
import ReportFinancial from "./pages/adminpura/Report";
import CreateFinanceReport from "./pages/adminpura/CreateFinanceReport";
import CreateCampaignReport from "./pages/adminpura/CreateCampaignReport";
import PuraList from "./pages/public/PuraList";
import PuraDetail from "./pages/public/PuraDetail";
import CampaignDetailPublic from "./pages/public/CampaignDetail";
import PuraFinancialReports from "./pages/public/PuraFinancialReport";
import FAQ from "./pages/public/FAQ";
// import CampaignSCDetail from "./pages/public/CampaignSCDetail";
import WithdrawCampaignList from "./pages/adminpura/WithdrawList";
import WithdrawRequestForm from "./pages/adminpura/WithdrawRequestForm";
import WithdrawList from "./pages/adminpura/WithdrawList";
import TrusteeWithdrawDashboard from "./pages/trustee/TrusteesDashboard";
import TrusteeWithdrawDetail from "./pages/trustee/WithdrawDetail";

// Donor pages & route guard
import DonorLogin from "./pages/donor/DonorLogin";
import DonorRegister from "./pages/donor/DonorRegister";
import DonorDashboard from "./pages/donor/DonorDashboard";
import PaymentResult from "./pages/donor/PaymentResult";
import ProtectedDonorRoute from "./components/ProtectedDonorRoute";

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
        <Route path="/pura" element={<PuraList />} />
        <Route path="/pura/:id" element={<PuraDetail />} />
        <Route path="/campaign/:id" element={<CampaignDetailPublic />} />
        <Route path="/pura/:puraId/financial-reports" element={<PuraFinancialReports />} />
        <Route path="/faq" element={<FAQ />} />
        {/* <Route path="/campaigns/sc/:id_campaign_onchain" element={<CampaignSCDetail />} /> */}

        {/* =====================
            DONOR ROUTES
        ====================== */}
        <Route path="/donor/login" element={<DonorLogin />} />
        <Route path="/donor/register" element={<DonorRegister />} />
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedDonorRoute>
              <DonorDashboard />
            </ProtectedDonorRoute>
          }
        />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* <Route path="/public/campaigns" element={<PublicCampaignList />} />
        <Route path="/campaigns/:id" element={<PublicCampaignDetail />}/> */}

        {/* =====================
            ADMIN AUTH
        ====================== */}
        <Route path="/login" element={<AdminLogin />} />

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
           Super-Admin DASHBOARD
        ====================== */}
        <Route
          path="/admin/super/*"
          element={
            <AdminProtectedRoute allowed={["SUPER_ADMIN"]}>
              <SuperAdminDashboard />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admins" element={<AdminManagement />} />
          <Route path="faqs" element={<FAQManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="offchain" element={<OffchainWithdrawals />} />
          <Route path="withdraws" element={<WithdrawTransfers />} />
          <Route path="withdraws/:id" element={<SuperAdminWithdrawDetail />} />
        </Route>

        
        <Route
          path="/admin/pura/*"
          element={
            <AdminProtectedRoute allowed={["ADMIN_PURA"]}>
              <AdminPuraLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<DashboardPura />} />
          <Route path="dashboard" element={<DashboardPura />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/create" element={<CampaignCreate />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="campaigns/:id/report" element={<CreateCampaignReport />} />
          <Route path="profile" element={<Profile />} />
          <Route path="financereports" element={<ReportFinancial />} />
          <Route path="financereports/create" element={<CreateFinanceReport />} />
          <Route path="withdraw/campaigns" element={<WithdrawCampaignList />} />
          <Route path="withdraw/request/:campaignId" element={<WithdrawRequestForm />} />
          <Route path="withdraws" element={<WithdrawList />} />
          
        </Route>


        <Route
          path="/admin/trustee"
          element={
            <AdminProtectedRoute allowed={["TRUSTEE"]}>
              <TrusteeWithdrawDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/trustee/withdraw/:id"
          element={
            <AdminProtectedRoute allowed={["TRUSTEE"]}>
              <TrusteeWithdrawDetail />
            </AdminProtectedRoute>
          }
        />



      </Routes>
    </BrowserRouter>
  );
}

export default App;
