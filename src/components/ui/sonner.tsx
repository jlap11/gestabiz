import { useTheme } from "@/contexts"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { CSSProperties } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  // Determinar el tema efectivo (similar a ThemeProvider)
  const getEffectiveTheme = () => {
    if (theme !== 'system') return theme
    if (typeof globalThis !== 'undefined' && globalThis.matchMedia) {
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  const effectiveTheme = getEffectiveTheme()

  // Definir los estilos según el tema efectivo
  const toastStyles: CSSProperties = effectiveTheme === 'light' 
    ? {
        background: 'oklch(1.00 0 0)', // --popover light
        color: 'oklch(0.12 0.02 270)', // --popover-foreground light
        border: '1px solid oklch(0.85 0.02 270)', // --border light
      }
    : {
        background: 'oklch(0.08 0.020 270)', // --popover dark
        color: 'oklch(0.95 0.005 270)', // --popover-foreground dark
        border: '1px solid oklch(0.20 0.010 270)', // --border dark
      }

  return (
    <Sonner
      theme={effectiveTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: toastStyles,
        classNames: {
          toast: effectiveTheme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-900 text-white',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
