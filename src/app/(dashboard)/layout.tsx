import { Sidebar } from "@/components/layout/sidebar"
import { Protected } from "@/components/auth/protected"
import { PageTransition } from "@/components/layout/page-transition"
import { SubscriptionBanner } from "@/components/billing/subscription-banner"
import { WorkspaceProvider } from "@/lib/firebase/workspace-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Protected>
      <WorkspaceProvider>
        <div className="min-h-screen bg-[--background]">
          <Sidebar />
          {/* Main content — margem fixa de 64px (sidebar colapsada) */}
          <div className="ml-16 flex flex-col min-h-screen">
            <SubscriptionBanner />
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </WorkspaceProvider>
    </Protected>
  )
}
