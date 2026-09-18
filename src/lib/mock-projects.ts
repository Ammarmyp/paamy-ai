export interface Project {
  id: string
  name: string
  slug: string
  owned: boolean
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-payments",
    name: "Payments Platform",
    slug: "payments-platform",
    owned: true,
  },
  {
    id: "proj-auth",
    name: "Auth Service",
    slug: "auth-service",
    owned: true,
  },
  {
    id: "proj-analytics",
    name: "Shared Analytics",
    slug: "shared-analytics",
    owned: false,
  },
]
