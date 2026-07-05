import { useEffect, useState } from "react"

import { fetchProxiedImage } from "@/lib/scanner/fetch-proxied-image"

type ProxiedCoverImageProps = {
  alt: string
  imageUrl: string
  refererUrl: string
}

export function ProxiedCoverImage({
  alt,
  imageUrl,
  refererUrl,
}: ProxiedCoverImageProps) {
  const [src, setSrc] = useState(imageUrl)

  useEffect(() => {
    let cancelled = false

    setSrc(imageUrl)
    fetchProxiedImage({ data: { imageUrl, refererUrl } })
      .then((proxiedSrc) => {
        if (!cancelled) {
          setSrc(proxiedSrc)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(imageUrl)
        }
      })

    return () => {
      cancelled = true
    }
  }, [imageUrl, refererUrl])

  return (
    <img
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      src={src}
    />
  )
}
