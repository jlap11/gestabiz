import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DropdownPortalProps {
  anchorRef: React.RefObject<HTMLElement>
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

// Small portal dropdown that positions itself next to an anchor button
export function DropdownPortal({
  anchorRef,
  isOpen,
  onClose,
  children,
}: DropdownPortalProps) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)

  const update = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return setPos(null)
    const rect = anchor.getBoundingClientRect()
    setPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!isOpen) return
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen, update])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen || !pos) return null

  // Flip horizontally/vertically if the menu would overflow the viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const estimatedWidth = Math.max(pos.width, 200)
  const estimatedHeight = 240 // approx max-h-64

  let finalLeft = pos.left
  let finalTop = pos.top

  // Horizontal flip
  if (pos.left + estimatedWidth > viewportWidth - 20) {
    finalLeft = Math.max(20, viewportWidth - estimatedWidth - 20)
  }

  // Vertical flip
  if (pos.top + estimatedHeight > viewportHeight - 20) {
    const anchor = anchorRef.current
    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      finalTop = rect.top + window.scrollY - estimatedHeight - 6
    }
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    top: finalTop,
    left: finalLeft,
    minWidth: pos.width,
    zIndex: 1000,
  }

  return createPortal(
    <div
      ref={portalRef}
      style={style}
      className="animate-in fade-in-0 zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}