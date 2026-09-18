function AuthBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="auth-grid absolute inset-0 opacity-40" />
      <svg
        className="absolute inset-0 size-full text-copy-faint opacity-30"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          fill="currentColor"
          fillOpacity="0.35"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeOpacity="0.55"
        >
          <path d="M120 180c40-50 95-70 150-55 48 12 78 48 110 72 28 22 68 28 98 8 36-24 42-78 78-98 48-28 112-8 148 28 28 28 38 72 22 108-18 42-62 58-98 78-40 22-52 72-28 108 18 28 58 42 58 82 0 48-52 72-98 62-42-8-68-48-108-58-48-12-98 18-142-2-38-18-48-68-82-88-42-26-98-8-128-48-28-38-18-98 20-149z" />
          <path d="M520 340c32-18 72-12 98 8 22 18 28 52 18 78-12 32-48 48-78 42-36-8-58-42-52-78 4-18 8-32 14-50z" />
          <path d="M180 420c28-8 58 8 68 32 12 28-8 58-36 68-28 8-58-8-68-36-10-26 8-56 36-64z" />
          <path d="M640 160c22-12 52-4 62 18 12 24 0 52-24 62-24 12-52 0-62-24-10-22 2-48 24-56z" />
        </g>
      </svg>
    </div>
  )
}

interface AuthShellProps {
  mode: "sign-in" | "sign-up"
  children: React.ReactNode
}

const features = [
  "Collaborative system design canvas",
  "AI-generated architectures from plain English",
  "Markdown specs from your final graph",
]

export function AuthShell({ mode, children }: AuthShellProps) {
  const headline =
    mode === "sign-in"
      ? "Welcome back to your architecture workspace."
      : "Start designing systems with your team."

  const supporting =
    mode === "sign-in"
      ? "Pick up where you left off — shared canvases, AI drafts, and specs in one place."
      : "Describe a system in plain English, refine it together, and ship a technical spec."

  return (
    <main className="flex min-h-full flex-1 bg-base font-sans">
      <aside className="hidden w-1/2 flex-col justify-center border-r border-surface-border bg-surface px-12 xl:px-16 lg:flex">
        <div className="mx-auto w-full max-w-md space-y-10">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-widest text-copy-muted uppercase">
              Paamy AI
            </p>
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-copy-primary xl:text-4xl">
              {headline}
            </h1>
            <p className="text-base leading-relaxed text-copy-secondary">
              {supporting}
            </p>
          </div>

          <ul className="space-y-4 border-t border-surface-border pt-8">
            {features.map((feature) => (
              <li
                key={feature}
                className="text-sm leading-relaxed text-copy-muted"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="relative flex w-full flex-1 items-center justify-center bg-base px-6 py-10 lg:w-1/2">
        <AuthBackdrop />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
          {children}
        </div>
      </section>
    </main>
  )
}
