import Sidebar from '@/components/AdminSidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
