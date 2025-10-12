import React, { useState } from 'react';
import { DollarSign, TrendingUp, FileText, Download, Building2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { FinancialOverview } from './FinancialOverview';
import { RevenueChart } from './RevenueChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { TopPerformers } from './TopPerformers';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';

interface DateRange {
  start: string;
  end: string;
}

export function FinancialManagementPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Filters
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  // Mock businesses and locations (replace with actual data fetching)
  const businesses = [
    { id: '1', name: 'Business 1' },
    { id: '2', name: 'Business 2' },
  ];

  const locations = [
    { id: '1', name: 'Location 1' },
    { id: '2', name: 'Location 2' },
  ];

  const handleExportData = () => {
    // Export all financial data to CSV/Excel
    const exportData = {
      overview: 'Overview metrics',
      revenue: 'Revenue chart data',
      categories: 'Category breakdown',
      performers: 'Top performers stats',
      transactions: 'Transaction list'
    };
    
    // Convert to CSV format and trigger download
    const csvContent = Object.entries(exportData)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleQuickDateRange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            {t('financial.management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('financial.managementDescription')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrintReport}>
            <FileText className="h-4 w-4 mr-2" />
            {t('financial.printReport')}
          </Button>
          <Button onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            {t('financial.exportData')}
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Business Selector */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('financial.selectBusiness')}
            </label>
            <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
              <SelectTrigger>
                <SelectValue placeholder={t('financial.allBusinesses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('financial.allBusinesses')}</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selector */}
          {selectedBusiness && selectedBusiness !== 'all' && (
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('financial.selectLocation')}
              </label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder={t('financial.allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('financial.allLocations')}</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              {t('financial.dateRange')}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <span className="flex items-center text-muted-foreground">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              {t('financial.quickFilters')}
            </label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange('week')}
                className="flex-1"
              >
                {t('financial.week')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange('month')}
                className="flex-1"
              >
                {t('financial.month')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange('quarter')}
                className="flex-1"
              >
                {t('financial.quarter')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange('year')}
                className="flex-1"
              >
                {t('financial.year')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('financial.overview')}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t('financial.analysis')}
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('financial.transactions')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FinancialOverview
            businessId={selectedBusiness || user?.business_id || ''}
            locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            dateRange={dateRange}
          />
          <RevenueChart
            businessId={selectedBusiness || user?.business_id || ''}
            locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            dateRange={dateRange}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown
              businessId={selectedBusiness || user?.business_id || ''}
              locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
              dateRange={dateRange}
            />
            <TopPerformers
              businessId={selectedBusiness || user?.business_id || ''}
              locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
            />
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionList
                businessId={selectedBusiness || user?.business_id || ''}
                locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
              />
            </div>
            <div>
              <TransactionForm
                businessId={selectedBusiness || user?.business_id || ''}
                locationId={selectedLocation !== 'all' ? selectedLocation : undefined}
                onSubmit={async (data) => {
                  // Handle transaction creation
                  // Will trigger TransactionList refresh via realtime subscription
                  return Promise.resolve();
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
