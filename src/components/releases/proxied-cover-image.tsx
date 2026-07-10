import { useEffect, useState } from "react"

import { fetchProxiedImage } from "@/lib/scanner/fetch-proxied-image"

type ProxiedCoverImageProps = {
  alt: string
  imageUrl: string
  refererUrl: string
  useProxy: boolean
}

export function ProxiedCoverImage({
  alt,
  imageUrl,
  refererUrl,
  useProxy,
}: ProxiedCoverImageProps) {
  const [src, setSrc] = useState(imageUrl)

  useEffect(() => {
    let cancelled = false

    setSrc(imageUrl)
    if (!useProxy) {
      return
    }

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
  }, [imageUrl, refererUrl, useProxy])

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
