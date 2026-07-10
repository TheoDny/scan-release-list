import { createFileRoute } from "@tanstack/react-router"
import { ReleaseDashboard } from "@/components/releases/release-dashboard"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return <ReleaseDashboard />
}
