import { useEffect } from 'react'

interface PageMetaProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonical?: string
}

export function usePageMeta({
  title,
  description,
  keywords,
  ogImage,
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
}: PageMetaProps) {
  useEffect(() => {
    // Set title
    if (title) {
      document.title = title
      setMetaTag('og:title', ogTitle || title)
      setMetaTag('twitter:title', twitterTitle || title)
    }

    // Set description
    if (description) {
      setMetaTag('description', description)
      setMetaTag('og:description', ogDescription || description)
      setMetaTag('twitter:description', twitterDescription || description)
    }

    // Set keywords
    if (keywords) {
      setMetaTag('keywords', keywords)
    }

    // Set OG image
    if (ogImage) {
      setMetaTag('og:image', ogImage)
    }

    // Set Twitter image
    if (twitterImage) {
      setMetaTag('twitter:image', twitterImage)
    } else if (ogImage) {
      setMetaTag('twitter:image', ogImage)
    }

    // Set Twitter card
    setMetaTag('twitter:card', twitterCard)

    // Set canonical
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.rel = 'canonical'
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.href = canonical
    }
  }, [
    title,
    description,
    keywords,
    ogImage,
    ogTitle,
    ogDescription,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    canonical,
  ])
}

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement | null
  }

  if (!tag) {
    tag = document.createElement('meta')
    const isProperty = name.startsWith('og:') || name.startsWith('twitter:')
    if (isProperty) {
      tag.setAttribute('property', name)
    } else {
      tag.setAttribute('name', name)
    }
    document.head.appendChild(tag)
  }

  tag.content = content
}
