import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { AuthTabs } from "@/components/auth/auth-tabs"

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <AuthTabs active="sign-in" />
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/editor"
        forceRedirectUrl="/editor"
      />
    </AuthShell>
  )
}
