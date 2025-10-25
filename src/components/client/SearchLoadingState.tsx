import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { SearchType } from './SearchBar'

interface SearchLoadingStateProps {
  searchTerm: string
  searchType: SearchType
}

export const SearchLoadingState: React.FC<SearchLoadingStateProps> = ({
  searchTerm,
  searchType,
}) => {
  const { t } = useLanguage()

  const getTypeLabel = (type: SearchType) => {
    switch (type) {
      case 'services':
        return t('search.resultsPage.typeLabels.service')
      case 'businesses':
        return t('search.resultsPage.typeLabels.business')
      case 'categories':
        return t('search.resultsPage.typeLabels.category')
      case 'users':
        return t('search.resultsPage.typeLabels.user')
      default:
        return type
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true" 
      aria-label={t('search.resultsPage.searching')}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" aria-hidden="true" />
          <p className="text-base sm:text-lg font-medium text-foreground text-center">
            {t('search.resultsPage.searching')}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 text-center">
            "{searchTerm}" {t('search.resultsPage.in')} {getTypeLabel(searchType)}s
          </p>
        </CardContent>
      </Card>
    </div>
  )
}