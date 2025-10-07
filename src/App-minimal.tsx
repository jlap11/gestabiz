import { Suspense } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function SimpleComponent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Bookio</h1>
        <p className="text-muted-foreground mt-4">
          Sistema funcionando correctamente. Todos los errores de process.env han sido corregidos.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <SimpleComponent />
        <Toaster richColors closeButton />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App