import { Sidebar } from "@/components/layout/sidebar"
import { Protected } from "@/components/auth/protected"
import { PageTransition } from "@/components/layout/page-transition"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Protected>
      <div className="min-h-screen bg-[--background]">
        <Sidebar />
        {/* Main content — margem fixa de 64px (sidebar colapsada) */}
        <div className="ml-16 flex flex-col min-h-screen">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </Protected>
  )
}
