import { useEffect } from 'react'

interface PageMetaOptions {
  title: string
  description: string
  image?: string
  path?: string
}

function ensureMetaTag(attribute: string, attributeValue: string, tagName = 'meta') {
  const existing = document.head.querySelector(`${tagName}[${attribute}="${attributeValue}"]`)
  if (existing) return existing as HTMLMetaElement

  const created = document.createElement(tagName)
  created.setAttribute(attribute, attributeValue)
  document.head.appendChild(created)
  return created as HTMLMetaElement
}

export function usePageMeta({ title, description, image, path = '/' }: PageMetaOptions) {
  useEffect(() => {
    document.title = title

    const descriptionTag = ensureMetaTag('name', 'description')
    descriptionTag.setAttribute('content', description)

    const ogTitle = ensureMetaTag('property', 'og:title')
    ogTitle.setAttribute('content', title)

    const ogDescription = ensureMetaTag('property', 'og:description')
    ogDescription.setAttribute('content', description)

    const ogType = ensureMetaTag('property', 'og:type')
    ogType.setAttribute('content', 'website')

    const ogUrl = ensureMetaTag('property', 'og:url')
    ogUrl.setAttribute('content', `${window.location.origin}${path}`)

    if (image) {
      const ogImage = ensureMetaTag('property', 'og:image')
      ogImage.setAttribute('content', image)
    }

    const twitterTitle = ensureMetaTag('name', 'twitter:title')
    twitterTitle.setAttribute('content', title)

    const twitterDescription = ensureMetaTag('name', 'twitter:description')
    twitterDescription.setAttribute('content', description)

    const canonical = document.head.querySelector('link[rel="canonical"]') ?? document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', `${window.location.origin}${path}`)
    if (!document.head.querySelector('link[rel="canonical"]')) {
      document.head.appendChild(canonical)
    }
  }, [title, description, image, path])
}

export function useJsonLd(json: Record<string, unknown>) {
  useEffect(() => {
    const existing = document.getElementById('agentflow-json-ld') as HTMLScriptElement | null
    const script = existing ?? document.createElement('script') as HTMLScriptElement

    script.id = 'agentflow-json-ld'
    script.type = 'application/ld+json'
    script.text = JSON.stringify(json)

    if (!existing) {
      document.head.appendChild(script)
    }
  }, [json])
}
