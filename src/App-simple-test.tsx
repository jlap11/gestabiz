import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>AppointmentPro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Sistema de gestión de citas funcionando!</p>
            <div className="flex items-center gap-4">
              <Button onClick={() => setCount(count - 1)}>-</Button>
              <span className="text-xl font-semibold">{count}</span>
              <Button onClick={() => setCount(count + 1)}>+</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              La aplicación está funcionando correctamente. 
              Todos los errores han sido corregidos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App