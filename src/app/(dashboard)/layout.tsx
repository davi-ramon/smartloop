import { Sidebar } from "@/components/layout/sidebar"
import { Protected } from "@/components/auth/protected"
import { PageTransition } from "@/components/layout/page-transition"
import { SubscriptionBanner } from "@/components/billing/subscription-banner"
import { WorkspaceProvider } from "@/lib/firebase/workspace-context"
import { BugReportWidget } from "@/components/bug-report/bug-report-widget"
import { ToastProvider } from "@/components/bio/editor/use-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Protected>
      <WorkspaceProvider>
        {/* ToastProvider cobre TODO o dashboard, permitindo useToast() em qualquer page do admin. */}
        <ToastProvider>
          <div className="min-h-screen bg-[--background]">
            <Sidebar />
            {/* Main content — margem fixa de 64px (sidebar colapsada) */}
            <div className="ml-16 flex flex-col min-h-screen">
              <SubscriptionBanner />
              <PageTransition>{children}</PageTransition>
            </div>
            <BugReportWidget />
          </div>
        </ToastProvider>
      </WorkspaceProvider>
    </Protected>
  )
}
