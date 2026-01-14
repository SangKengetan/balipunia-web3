import Sidebar from "./adminpura/Sidebar";

export default function DashboardShell({ title, children }) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-8">
        {title && (
          <h1 className="text-2xl font-bold mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}
