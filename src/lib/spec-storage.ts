import { get, put } from "@vercel/blob"

export function specBlobPathname(projectId: string, specId: string): string {
  return `specs/${projectId}/${specId}.md`
}

export async function uploadSpecMarkdown(
  projectId: string,
  specId: string,
  markdown: string,
): Promise<string> {
  const blob = await put(
    specBlobPathname(projectId, specId),
    markdown,
    {
      access: "private",
      contentType: "text/markdown; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    },
  )

  return blob.url
}

export async function fetchSpecMarkdownFromUrl(url: string): Promise<string> {
  const result = await get(url, {
    access: "private",
    useCache: false,
  })

  if (!result || result.statusCode !== 200 || !result.stream) {
    const status = result?.statusCode ?? "null"
    throw new Error(`Failed to fetch spec blob (${status})`)
  }

  return new Response(result.stream).text()
}
