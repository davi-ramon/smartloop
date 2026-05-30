import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[--background]">
      <Sidebar />
      {/* Main content — margem fixa de 64px (sidebar colapsada) */}
      <div className="ml-16 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
