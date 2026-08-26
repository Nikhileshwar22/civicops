import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { GhmcSeal } from '@/components/brand/ghmc-logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="relative flex-1 overflow-y-auto p-8 bg-[#f4f5f7]">
            {/* GHMC seal watermark background */}
            <div className="pointer-events-none fixed right-10 top-1/2 -translate-y-1/2 w-[480px] h-[480px] opacity-[0.05] z-0">
              <GhmcSeal className="w-full h-full" />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
