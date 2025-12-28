import { DashboardShell } from "@/components/layout/DashboardShell";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
