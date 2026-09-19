import { clerkClient } from "@clerk/nextjs/server"

export interface ClerkUserProfile {
  email: string
  name: string | null
  imageUrl: string | null
}

function displayNameFromUser(user: {
  fullName: string | null
  firstName: string | null
  lastName: string | null
  username: string | null
}): string | null {
  if (user.fullName?.trim()) {
    return user.fullName.trim()
  }

  const parts = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))

  if (parts.length > 0) {
    return parts.join(" ")
  }

  if (user.username?.trim()) {
    return user.username.trim()
  }

  return null
}

/**
 * Enrich collaborator emails with Clerk display name + avatar.
 * Emails without a matching Clerk user keep name/imageUrl as null.
 */
export async function enrichEmailsWithClerkProfiles(
  emails: string[],
): Promise<Map<string, ClerkUserProfile>> {
  const normalized = [
    ...new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    ),
  ]

  const profiles = new Map<string, ClerkUserProfile>()
  for (const email of normalized) {
    profiles.set(email, { email, name: null, imageUrl: null })
  }

  if (normalized.length === 0) {
    return profiles
  }

  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserList({
      emailAddress: normalized,
      limit: Math.min(100, normalized.length),
    })

    for (const user of data) {
      const userEmails = user.emailAddresses.map((entry) =>
        entry.emailAddress.trim().toLowerCase(),
      )
      const matched = userEmails.find((email) => profiles.has(email))
      if (!matched) {
        continue
      }

      profiles.set(matched, {
        email: matched,
        name: displayNameFromUser(user),
        imageUrl: user.imageUrl || null,
      })
    }
  } catch {
    // Fall back to email-only profiles when Clerk lookup fails.
  }

  return profiles
}
