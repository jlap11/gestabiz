import { useState } from 'react'

interface BusinessService {
  _key: string
  name: string
  category: string
  duration: number
  price: number | string
  description: string
}

export function useBusinessServices() {
  const [businessServices, setBusinessServices] = useState<BusinessService[]>([
    {
      _key: crypto.randomUUID(),
      name: '',
      category: '',
      duration: 60,
      price: 0,
      description: '',
    },
  ])

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    setBusinessServices(prev =>
      prev.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    )
  }

  const addService = () => {
    setBusinessServices(prev => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        name: '',
        category: '',
        duration: 60,
        price: 0,
        description: '',
      },
    ])
  }

  const removeService = (index: number) => {
    setBusinessServices(prev => prev.filter((_, i) => i !== index))
  }

  return {
    businessServices,
    handleServiceChange,
    addService,
    removeService,
  }
}