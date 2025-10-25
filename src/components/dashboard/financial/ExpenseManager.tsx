// ============================================================================
// COMPONENT: ExpenseManager
// Gestión completa de gastos recurrentes con plantillas y alertas
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, Calendar, TrendingUp, Repeat, FileText } from 'lucide-react';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { useExpenseManager } from '@/hooks/useExpenseManager';
import { ExpenseCard } from '@/components/expense/ExpenseCard';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { ExpenseTemplateCard } from '@/components/expense/ExpenseTemplateCard';
import { EXPENSE_TEMPLATES } from '@/constants/expense';
import { calculateTotalExpenses } from '@/utils/expense';

interface ExpenseManagerProps {
  businessId: string;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ businessId }) => {
  const {
    recurringExpenses,
    upcomingPayments,
    overduePayments,
    isDialogOpen,
    editingExpense,
    activeTab,
    isLoading,
    handleNewExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleUseTemplate,
    handleCloseDialog,
    handleFormSubmit,
    setActiveTab,
  } = useExpenseManager();

  const totalMonthlyExpenses = calculateTotalExpenses(
    recurringExpenses.filter(expense => expense.frequency === 'monthly')
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-0">
      {/* Header with Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="min-h-[100px]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Gasto Mensual Estimado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground break-words">
              {formatCOP(totalMonthlyExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Próximos Pagos (7 días)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{upcomingPayments.length}</p>
          </CardContent>
        </Card>

        <Card className={`min-h-[100px] ${overduePayments.length > 0 ? 'border-red-500' : ''} sm:col-span-2 lg:col-span-1`}>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Pagos Vencidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-lg sm:text-2xl font-bold ${overduePayments.length > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {overduePayments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl truncate">Gestión de Gastos Recurrentes</CardTitle>
            </div>
            <Button onClick={handleNewExpense} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Nuevo Gasto</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Responsive Tabs */}
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="recurring" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Repeat className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Gastos Activos</span>
                <span className="sm:hidden">Activos</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Próximos Pagos</span>
                <span className="sm:hidden">Próximos</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Plantillas</span>
                <span className="sm:hidden">Plantillas</span>
              </TabsTrigger>
            </TabsList>

            {/* Gastos Recurrentes */}
            <TabsContent value="recurring" className="space-y-4 mt-4 sm:mt-6">
              {isLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">Cargando gastos...</p>
                </div>
              ) : recurringExpenses.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                    No tienes gastos recurrentes configurados
                  </p>
                  <Button onClick={handleNewExpense} variant="outline" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear tu primer gasto
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {recurringExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onEdit={handleEditExpense}
                      onDelete={handleDeleteExpense}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Próximos Pagos */}
            <TabsContent value="upcoming" className="space-y-4 mt-4 sm:mt-6">
              {upcomingPayments.length === 0 && overduePayments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base px-4">
                    No tienes pagos próximos en los siguientes 7 días
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {overduePayments.length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>Pagos Vencidos</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        {overduePayments.map((expense) => (
                          <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {upcomingPayments.filter(expense => new Date(expense.next_payment_date) >= new Date()).length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>Próximos 7 Días</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {upcomingPayments
                          .filter(expense => new Date(expense.next_payment_date) >= new Date())
                          .map((expense) => (
                            <ExpenseCard
                              key={expense.id}
                              expense={expense}
                              onEdit={handleEditExpense}
                              onDelete={handleDeleteExpense}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Plantillas */}
            <TabsContent value="templates" className="space-y-4 mt-4 sm:mt-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Plantillas Predefinidas
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Usa estas plantillas para crear gastos comunes rápidamente
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {EXPENSE_TEMPLATES.map((template) => (
                  <ExpenseTemplateCard
                    key={template.id}
                    template={template}
                    onUseTemplate={handleUseTemplate}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Formulario de gastos */}
      <ExpenseForm
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleFormSubmit}
        editingExpense={editingExpense}
        isLoading={isLoading}
      />
    </div>
  );
};