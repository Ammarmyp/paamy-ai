import { dark } from "@clerk/ui/themes"

const monoSurface = {
  backgroundColor: "transparent",
  boxShadow: "none",
  border: "none",
} as const

export const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  variables: {
    colorPrimary: "var(--text-primary)",
    colorPrimaryForeground: "var(--bg-base)",
    colorBackground: "var(--bg-surface)",
    colorForeground: "var(--text-primary)",
    colorMuted: "var(--bg-subtle)",
    colorMutedForeground: "var(--text-muted)",
    colorInput: "var(--bg-base)",
    colorInputForeground: "var(--text-primary)",
    colorNeutral: "var(--text-secondary)",
    colorBorder: "var(--border-default)",
    colorRing: "var(--border-subtle)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    colorModalBackdrop: "var(--bg-base)",
    fontFamily: "var(--font-geist-sans)",
    fontFamilyButtons: "var(--font-geist-sans)",
    fontFamilyMono: "var(--font-geist-mono)",
    borderRadius: "var(--radius)",
  },
  elements: {
    rootBox: "w-full",
    logoBox: { display: "none" },
    cardBox: monoSurface,
    card: monoSurface,
    headerTitle: {
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-sans)",
      fontWeight: "600",
      fontSize: "1.5rem",
      letterSpacing: "-0.02em",
    },
    headerSubtitle: {
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-sans)",
      fontSize: "0.875rem",
    },
    formFieldLabel: {
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-sans)",
      fontWeight: "500",
    },
    formFieldInput: {
      backgroundColor: "var(--bg-base)",
      borderColor: "var(--border-default)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-sans)",
    },
    formButtonPrimary: {
      backgroundColor: "var(--text-primary)",
      color: "var(--bg-base)",
      fontFamily: "var(--font-geist-sans)",
      fontWeight: "600",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "var(--text-secondary)",
      },
    },
    socialButtons: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    socialButtonsBlockButton: {
      backgroundColor: "var(--bg-base)",
      borderColor: "var(--border-default)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-sans)",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "var(--bg-elevated)",
      },
    },
    socialButtonsBlockButtonText: {
      color: "var(--text-primary)",
      fontFamily: "var(--font-geist-sans)",
    },
    footer: {
      background: "transparent",
      backgroundColor: "transparent",
    },
    footerAction: {
      display: "none",
    },
    footerActionLink: {
      color: "var(--text-primary)",
    },
    identityPreviewEditButton: {
      color: "var(--text-muted)",
    },
    formFieldAction: {
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-sans)",
      textDecoration: "underline",
    },
    dividerLine: {
      backgroundColor: "var(--border-default)",
    },
    dividerText: {
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-sans)",
    },
  },
}
