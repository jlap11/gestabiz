import { useState, useCallback } from 'react'

export const usePriceFormatter = (initialPrice: number = 0) => {
  const [priceDisplay, setPriceDisplay] = useState('')

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('es-CO').format(price)
  }, [])

  const parsePrice = useCallback((value: string): number => {
    const cleanValue = value.replace(/[^\d]/g, '')
    return cleanValue ? parseInt(cleanValue, 10) : 0
  }, [])

  const handlePriceChange = useCallback((value: string, onPriceChange: (price: number) => void) => {
    const numericValue = parsePrice(value)
    setPriceDisplay(value)
    onPriceChange(numericValue)
  }, [parsePrice])

  const handlePriceBlur = useCallback((price: number) => {
    if (price > 0) {
      setPriceDisplay(formatPrice(price))
    } else {
      setPriceDisplay('')
    }
  }, [formatPrice])

  const updatePriceDisplay = useCallback((price: number) => {
    if (price > 0) {
      setPriceDisplay(formatPrice(price))
    } else {
      setPriceDisplay('')
    }
  }, [formatPrice])

  return {
    priceDisplay,
    formatPrice,
    handlePriceChange,
    handlePriceBlur,
    updatePriceDisplay,
  }
}