'use client'

import Link, { type LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'

interface ViewTransitionLinkProps extends LinkProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ViewTransitionLink({ children, href, className, style, ...props }: ViewTransitionLinkProps) {
  const router = useRouter()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const hrefValue = typeof href === 'string' ? href : href.pathname ?? ''
    if (!hrefValue || !document.startViewTransition) return
    event.preventDefault()
    document.startViewTransition(() => router.push(hrefValue))
  }

  return <Link href={href} className={className} style={style} onClick={handleClick} {...props}>{children}</Link>
}
