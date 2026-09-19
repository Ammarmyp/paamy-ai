import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Lock className="h-8 w-8 text-copy-muted" aria-hidden />
      <h1 className="mt-4 text-xl font-medium tracking-tight text-copy-primary">
        Access denied
      </h1>
      <p className="mt-2 max-w-md text-sm text-copy-muted">
        This project does not exist or you do not have permission to open it.
      </p>
      <Button
        nativeButton={false}
        className="mt-6"
        render={<Link href="/editor" />}
      >
        Back to editor
      </Button>
    </div>
  )
}
