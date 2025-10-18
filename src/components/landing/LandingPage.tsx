import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Smartphone,
  BarChart3,
  MessageSquare,
  Briefcase,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Menu,
  X
} from 'lucide-react'
import { PricingPlans } from './PricingPlans'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuth } from '@/contexts/AuthContext'

interface LandingPageProps {
  onNavigateToAuth: () => void
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const analytics = useAnalytics()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('/', 'Landing Page - Gestabiz')
  }, [analytics])

  // Redirigir a /app si el usuario está autenticado
  useEffect(() => {
    if (!loading && user) {
      navigate('/app', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    // Forzar tema claro en la landing page
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      // Restaurar el tema original al desmontar
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 rounded-lg p-2">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                Gestabiz
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Características
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Beneficios
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Planes
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Testimonios
              </a>
              <Button 
                variant="ghost" 
                onClick={onNavigateToAuth}
                className="text-gray-700 hover:text-purple-600"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={onNavigateToAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4 border-t pt-4">
              <a href="#features" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                Características
              </a>
              <a href="#benefits" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                Beneficios
              </a>
              <a href="#pricing" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                Planes
              </a>
              <a href="#testimonials" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                Testimonios
              </a>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onNavigateToAuth}
              >
                Iniciar Sesión
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={onNavigateToAuth}
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200">
                Diseñado para PyMES Colombianas
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Gestiona tu negocio en{' '}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  piloto automático
                </span>
              </h1>
              
              <p className="text-xl text-gray-600">
                La plataforma TODO-EN-UNO para gestionar citas, clientes, empleados, 
                contabilidad y más. Ahorra tiempo, aumenta ingresos y crece sin límites.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white text-lg"
                  onClick={onNavigateToAuth}
                >
                  Prueba 30 Días GRATIS
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Ver Planes y Precios
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Cancela cuando quieras</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-purple-600">800+</div>
                  <div className="text-sm text-gray-600">Negocios Activos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600">Citas Agendadas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">Satisfacción</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-blue-200 blur-3xl rounded-full" />
              <Card className="relative bg-white border-purple-200 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Mock Dashboard */}
                    <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold text-gray-900">Dashboard</span>
                        </div>
                        <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">Hoy</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-100 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-600">24</div>
                          <div className="text-xs text-gray-600">Citas Hoy</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-600">$2.4M</div>
                          <div className="text-xs text-gray-600">Ingresos Mes</div>
                        </div>
                      </div>
                    </div>

                    {/* Mock Calendar */}
                    <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">Próximas Citas</span>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded p-2">
                            <div className="w-2 h-2 rounded-full bg-purple-600" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-900">Cliente {i}</div>
                              <div className="text-xs text-gray-600">
                                {9 + i}:00 AM - Corte de cabello
                              </div>
                            </div>
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                              Confirmada
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Datos seguros y encriptados</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">Funcionalidades</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Todo lo que necesitas en una sola plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Deja de usar 5 herramientas diferentes. Gestabiz lo tiene TODO.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Gestión de Citas',
                description: 'Calendario inteligente con prevención de conflictos y sincronización con Google Calendar.',
                color: 'text-blue-500'
              },
              {
                icon: MessageSquare,
                title: 'Recordatorios Automáticos',
                description: 'WhatsApp, Email y SMS. Reduce no-shows en un 70%. Tus clientes nunca olvidan.',
                color: 'text-green-500'
              },
              {
                icon: Users,
                title: 'Gestión de Clientes',
                description: 'Base de datos completa con historial, notas y análisis de clientes recurrentes.',
                color: 'text-purple-500'
              },
              {
                icon: BarChart3,
                title: 'Sistema Contable',
                description: 'IVA, ICA, Retención. Reportes P&L automáticos. Preparado para DIAN Colombia.',
                color: 'text-orange-500'
              },
              {
                icon: Smartphone,
                title: 'App Móvil Nativa',
                description: 'iOS y Android. Gestiona tu negocio desde cualquier lugar, en cualquier momento.',
                color: 'text-pink-500'
              },
              {
                icon: Briefcase,
                title: 'Portal de Empleos',
                description: 'Publica vacantes, gestiona aplicaciones y encuentra el talento que necesitas.',
                color: 'text-indigo-500'
              },
              {
                icon: TrendingUp,
                title: 'Analytics Avanzados',
                description: 'Dashboards interactivos, gráficos en tiempo real y reportes exportables.',
                color: 'text-cyan-500'
              },
              {
                icon: Zap,
                title: 'Automatizaciones',
                description: 'Confirmaciones, recordatorios, facturas. Todo automático mientras duermes.',
                color: 'text-yellow-500'
              },
              {
                icon: Shield,
                title: 'Seguridad Total',
                description: 'Encriptación de datos, backups automáticos y cumplimiento de privacidad.',
                color: 'text-red-500'
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="bg-white border-gray-200 hover:border-purple-600/50 transition-all hover:shadow-lg"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-purple-100 text-purple-700 border-purple-300">Beneficios Reales</Badge>
              <h2 className="text-4xl font-bold text-gray-900">
                Recupera hasta $1.5M pesos mensuales en citas perdidas
              </h2>
              <p className="text-lg text-gray-600">
                No es magia, son datos. Nuestros clientes recuperan en promedio 70% de las citas 
                que antes se perdían por olvidos o cancelaciones.
              </p>

              <div className="space-y-6">
                {[
                  {
                    stat: '70%',
                    label: 'Reducción de No-Shows',
                    description: 'Los recordatorios automáticos funcionan'
                  },
                  {
                    stat: '8-12h',
                    label: 'Tiempo Ahorrado Semanal',
                    description: 'Ya no pierdes tiempo agendando manualmente'
                  },
                  {
                    stat: '35%',
                    label: 'Aumento en Reservas',
                    description: 'Tus clientes agendan 24/7, incluso cuando duermes'
                  },
                  {
                    stat: '900%',
                    label: 'ROI Promedio',
                    description: 'La inversión se paga sola en el primer mes'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600 leading-tight">{benefit.stat}</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="font-semibold text-lg text-gray-900">{benefit.label}</div>
                      <div className="text-gray-600">{benefit.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="lg" onClick={onNavigateToAuth}>
                Empieza a Recuperar Dinero Hoy
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-l from-purple-200 to-purple-100 blur-3xl rounded-full" />
              <Card className="relative bg-white border-gray-200 shadow-xl">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-purple-600 mb-2">$1.250.000</div>
                    <div className="text-xl font-semibold text-gray-900 mb-2">Dinero Perdido Mensual</div>
                    <div className="text-sm text-gray-600">
                      Si pierdes 25 citas/mes a $50.000 cada una
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900">Con Gestabiz</span>
                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">Recuperas</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Citas recuperadas (70%)</span>
                        <span className="font-semibold text-gray-900">$875.000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Costo de AppointSync</span>
                        <span className="font-semibold text-gray-900">-$79.900</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                        <span className="font-bold text-gray-900">Ganancia Neta</span>
                        <span className="font-bold text-green-600">+$795.100</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/10 rounded-lg p-4 text-center">
                    <div className="text-sm text-green-700 font-semibold">
                      🎉 La inversión se paga SOLA en el primer mes
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">Planes y Precios</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Precios transparentes. Sin sorpresas.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Más barato que la competencia. Más funcionalidades. Precio justo para tu negocio.
            </p>
          </div>

          <PricingPlans showCTA={true} onSelectPlan={onNavigateToAuth} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">Testimonios</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Más de 800 negocios en Colombia confían en Gestabiz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                business: 'Salón Glamour - Medellín',
                avatar: 'M',
                rating: 5,
                text: 'No puedo creer que no empecé antes. Mis clientas dicen que se ve súper profesional y yo estoy mucho más tranquila. Recuperé $720.000/mes en citas perdidas.',
                stat: '900% ROI'
              },
              {
                name: 'Dr. Carlos Ramírez',
                business: 'Consultorio Dental SmileCare - Bogotá',
                avatar: 'C',
                rating: 5,
                text: 'Como médico, mi tiempo vale oro. AppointSync me devolvió 10 horas a la semana. Ahora atiendo más pacientes y mi contador está feliz.',
                stat: '800% ROI'
              },
              {
                name: 'Juan Martínez',
                business: 'Personal Trainer - Cali',
                avatar: 'J',
                rating: 5,
                text: 'Invertí $29.900 y me cambió la vida. Ahora parezco un negocio profesional. Incluso subí mis precios. Mejor inversión que he hecho.',
                stat: '2000% ROI'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden bg-white border-gray-200 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-bold text-purple-600">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.business}</div>
                    </div>
                  </div>

                  <Badge className="absolute top-4 right-4 bg-green-100 text-green-700 border-green-300">
                    {testimonial.stat}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-500 border-0 text-white">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl font-bold text-white">
                ¿Listo para transformar tu negocio?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Únete a más de 800 negocios que ya están ahorrando tiempo y aumentando ingresos 
                con Gestabiz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-white/90 text-lg"
                  onClick={onNavigateToAuth}
                >
                  Empieza GRATIS por 30 Días
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg"
                  onClick={onNavigateToAuth}
                >
                  Ya tengo cuenta
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Cancela cuando quieras</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Soporte en español</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-600 rounded-lg p-2">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">Gestabiz</span>
              </div>
              <p className="text-sm text-gray-600">
                La plataforma #1 de gestión empresarial para PyMES colombianas.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-purple-600">Características</a></li>
                <li><a href="#pricing" className="hover:text-purple-600">Precios</a></li>
                <li><a href="#" className="hover:text-purple-600">Integraciones</a></li>
                <li><a href="#" className="hover:text-purple-600">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Recursos</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-purple-600">Blog</a></li>
                <li><a href="#" className="hover:text-purple-600">Ayuda</a></li>
                <li><a href="#" className="hover:text-purple-600">Tutoriales</a></li>
                <li><a href="#" className="hover:text-purple-600">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-purple-600">Términos</a></li>
                <li><a href="#" className="hover:text-purple-600">Privacidad</a></li>
                <li><a href="#" className="hover:text-purple-600">Cookies</a></li>
                <li><a href="#" className="hover:text-purple-600">Licencias</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2025 Gestabiz. Todos los derechos reservados.</p>
            <p>Hecho con ❤️ en Colombia 🇨🇴</p>
          </div>
        </div>
      </footer>
    </div>
  )
}







