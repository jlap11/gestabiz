import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Star, 
  Pencil, 
  Trash, 
  Clock,
  CurrencyDollar,
  Tag,
  MagnifyingGlass,
  Sliders,
  SquaresFour,
  List
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@/lib/useKV'
import { useLanguage, formatCurrency } from '@/contexts/LanguageContext'
import { User, Service } from '@/types'

interface ServiceManagementProps {
  user: User
}

const SERVICE_CATEGORIES = [
  { id: 'consultation', name: 'Consulta', color: 'bg-blue-500' },
  { id: 'treatment', name: 'Tratamiento', color: 'bg-green-500' },
  { id: 'therapy', name: 'Terapia', color: 'bg-purple-500' },
  { id: 'maintenance', name: 'Mantenimiento', color: 'bg-orange-500' },
  { id: 'emergency', name: 'Emergencia', color: 'bg-red-500' },
  { id: 'cosmetic', name: 'Cosmético', color: 'bg-pink-500' },
  { id: 'wellness', name: 'Bienestar', color: 'bg-teal-500' },
  { id: 'other', name: 'Otro', color: 'bg-gray-500' }
]

export default function ServiceManagement({ user }: Readonly<ServiceManagementProps>) {
  const { t, language } = useLanguage()
  const [services, setServices] = useKV<Service[]>(`services-${user.business_id || user.id}`, [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    category: 'consultation',
    is_active: true,
    requires_preparation: false,
    online_available: false,
    max_participants: 1
  })

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.price || !formData.duration) {
        toast.error(t('error.validation'))
        return
      }

      const serviceData: Service = {
        id: editingService?.id || Date.now().toString(),
        name: formData.name!,
        description: formData.description || '',
        duration: formData.duration!,
        price: formData.price!,
        category: formData.category!,
        is_active: formData.is_active ?? true,
        requires_preparation: formData.requires_preparation ?? false,
        online_available: formData.online_available ?? false,
        max_participants: formData.max_participants || 1,
        business_id: user.business_id || user.id,
        created_at: editingService?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.id
      }

      if (editingService) {
        setServices(prev => prev.map(service => service.id === editingService.id ? serviceData : service))
        toast.success('Servicio actualizado exitosamente')
      } else {
        setServices(prev => [...prev, serviceData])
        toast.success('Servicio creado exitosamente')
      }

      setShowDialog(false)
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        duration: 60,
        price: 0,
        category: 'consultation',
        is_active: true,
        requires_preparation: false,
        online_available: false,
        max_participants: 1
      })
    } catch (error) {
      toast.error(t('message.error'))
      throw error
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData(service)
    setShowDialog(true)
  }

  const handleDelete = async (serviceId: string) => {
    try {
      setServices(prev => prev.filter(service => service.id !== serviceId))
      toast.success('Servicio eliminado exitosamente')
    } catch (error) {
      toast.error(t('message.error'))
      throw error
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      category: 'consultation',
      is_active: true,
      requires_preparation: false,
      online_available: false,
      max_participants: 1
    })
    setEditingService(null)
  }

  const getCategoryInfo = (categoryId: string) => {
    return SERVICE_CATEGORIES.find(cat => cat.id === categoryId) || SERVICE_CATEGORIES.find(cat => cat.id === 'other')!
  }

  const activeServices = services.filter(s => s.is_active).length
  const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0)
  const averagePrice = services.length > 0 ? totalRevenue / services.length : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('services.title')}</h2>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces a tus clientes
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={resetForm}>
              <Plus size={16} />
              {t('services.new')}
            </Button>
          </DialogTrigger>
          <ServiceDialog
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            isEditing={!!editingService}
            t={t}
          />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Servicios</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servicios Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeServices}</p>
              </div>
              <Tag className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(averagePrice, 'EUR', language as any)}</p>
              </div>
              <CurrencyDollar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duración Promedio</p>
                <p className="text-2xl font-bold">
                  {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length) : 0} min
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder={t('action.search') + ' servicios...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Sliders size={16} className="mr-2" />
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {SERVICE_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <SquaresFour size={16} />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Services Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
              onDelete={handleDelete}
              language={language}
              t={t}
            />
          ))}
          {filteredServices.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('message.no_data')}</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const categoryInfo = getCategoryInfo(service.category || 'other')
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${categoryInfo.color}`} />
                          <span className="text-sm">{categoryInfo.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {service.duration} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CurrencyDollar size={14} />
                          {formatCurrency(service.price, 'EUR', language as any)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {filteredServices.length === 0 && (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('message.no_data')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
  language: string
  t: (key: string) => string
}

function ServiceCard({ service, onEdit, onDelete, language, t }: Readonly<ServiceCardProps>) {
  const categoryInfo = SERVICE_CATEGORIES.find(cat => cat.id === (service.category || 'other')) || SERVICE_CATEGORIES.find(cat => cat.id === 'other')!

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${categoryInfo.color}`} />
              <Badge variant="outline">{categoryInfo.name}</Badge>
              <Badge variant={service.is_active ? "default" : "secondary"}>
                {service.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(service)}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(service.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={14} />
              <span>{service.duration} minutos</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-primary">
              <CurrencyDollar size={14} />
              <span>{formatCurrency(service.price, 'EUR', language as any)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {service.online_available && (
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            )}
            {service.requires_preparation && (
              <Badge variant="secondary" className="text-xs">
                Requiere preparación
              </Badge>
            )}
            {(service.max_participants ?? 1) > 1 && (
              <Badge variant="secondary" className="text-xs">
                Grupal ({service.max_participants} personas)
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ServiceDialogProps {
  formData: Partial<Service>
  setFormData: (data: Partial<Service>) => void
  onSave: () => void
  isEditing: boolean
  t: (key: string) => string
}

function ServiceDialog({ formData, setFormData, onSave, isEditing, t }: Readonly<ServiceDialogProps>) {
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? t('services.edit') : t('services.new')}
        </DialogTitle>
        <DialogDescription>
          {isEditing ? 'Actualiza la información del servicio' : 'Agrega un nuevo servicio a tu catálogo'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold">Información Básica</h3>
          
          <div>
            <Label htmlFor="name">{t('services.name')}</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del servicio"
            />
          </div>

          <div>
            <Label htmlFor="description">{t('services.description')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del servicio"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">{t('services.category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing and Duration */}
        <div className="space-y-4">
          <h3 className="font-semibold">Precio y Duración</h3>
          
          <div>
            <Label htmlFor="duration">{t('services.duration')}</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration || ''}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              placeholder="60"
              min="15"
              step="15"
            />
          </div>

          <div>
            <Label htmlFor="price">{t('services.price')} (€)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="max_participants">Máximo de Participantes</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants || 1}
              onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
              min="1"
              max="50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Servicio activo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requires_preparation"
                checked={formData.requires_preparation ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_preparation: checked })}
              />
              <Label htmlFor="requires_preparation">Requiere preparación</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="online_available"
                checked={formData.online_available ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, online_available: checked })}
              />
              <Label htmlFor="online_available">Disponible online</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {}}>
          {t('action.cancel')}
        </Button>
        <Button onClick={onSave}>
          {t('action.save')}
        </Button>
      </div>
    </DialogContent>
  )
}