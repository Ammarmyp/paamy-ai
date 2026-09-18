import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { AuthTabs } from "@/components/auth/auth-tabs"

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <AuthTabs active="sign-up" />
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/editor"
        forceRedirectUrl="/editor"
      />
    </AuthShell>
  )
}
