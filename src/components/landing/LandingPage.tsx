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
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/ui/language-toggle'
import logoTiTuring from '@/assets/images/tt/1.png'

interface LandingPageProps {
  onNavigateToAuth: () => void
}

export function LandingPage({ onNavigateToAuth }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const analytics = useAnalytics()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { t } = useLanguage()

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
        (mobileMenuOpen || scrolled) ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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
                {t('landing.nav.features')}
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                {t('landing.nav.benefits')}
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                {t('landing.nav.pricing')}
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                {t('landing.nav.testimonials')}
              </a>
              <LanguageToggle />
              <Button 
                variant="ghost" 
                onClick={onNavigateToAuth}
                className="text-gray-700 hover:text-purple-600"
              >
                {t('landing.nav.signIn')}
              </Button>
              <Button 
                onClick={onNavigateToAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('landing.nav.getStarted')}
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
                {t('landing.nav.features')}
              </a>
              <a href="#benefits" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                {t('landing.nav.benefits')}
              </a>
              <a href="#pricing" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                {t('landing.nav.pricing')}
              </a>
              <a href="#testimonials" className="block text-foreground/80 hover:text-purple-600 transition-colors">
                {t('landing.nav.testimonials')}
              </a>
              <div className="flex justify-center">
                <LanguageToggle />
              </div>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onNavigateToAuth}
              >
                {t('landing.nav.signIn')}
              </Button>
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={onNavigateToAuth}
              >
                {t('landing.nav.getStarted')}
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
                {t('landing.hero.badge')}
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                {t('landing.hero.title')}{' '}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {t('landing.hero.titleHighlight')}
                </span>
              </h1>
              
              <p className="text-xl text-gray-600">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white text-lg"
                  onClick={onNavigateToAuth}
                >
                  {t('landing.hero.cta.trial')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {t('landing.hero.cta.pricing')}
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">{t('landing.hero.cta.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">{t('landing.hero.cta.cancelAnytime')}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-purple-600">800+</div>
                  <div className="text-sm text-gray-600">{t('landing.hero.stats.businesses')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">50K+</div>
                  <div className="text-sm text-gray-600">{t('landing.hero.stats.appointments')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600">{t('landing.hero.stats.satisfaction')}</div>
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
                          <span className="font-semibold text-gray-900">{t('landing.dashboard.title')}</span>
                        </div>
                        <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">{t('landing.dashboard.today')}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-100 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-600">24</div>
                          <div className="text-xs text-gray-600">{t('landing.dashboard.appointments')}</div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-600">$2.4M</div>
                          <div className="text-xs text-gray-600">{t('landing.dashboard.revenue')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Mock Calendar */}
                    <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">{t('landing.dashboard.upcoming')}</span>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={`appointment-${i}`} className="flex items-center gap-3 bg-gray-50 rounded p-2">
                            <div className="w-2 h-2 rounded-full bg-purple-600" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-900">{t('landing.dashboard.client')} {i}</div>
                              <div className="text-xs text-gray-600">
                                {9 + i}:00 AM - {t('landing.dashboard.haircut')}
                              </div>
                            </div>
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                              {t('landing.dashboard.confirmed')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>{t('landing.dashboard.secureData')}</span>
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
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">{t('landing.features.badge')}</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                titleKey: 'landing.features.list.appointments.title',
                descKey: 'landing.features.list.appointments.description',
                color: 'text-blue-500'
              },
              {
                icon: MessageSquare,
                titleKey: 'landing.features.list.reminders.title',
                descKey: 'landing.features.list.reminders.description',
                color: 'text-green-500'
              },
              {
                icon: Users,
                titleKey: 'landing.features.list.clients.title',
                descKey: 'landing.features.list.clients.description',
                color: 'text-purple-500'
              },
              {
                icon: BarChart3,
                titleKey: 'landing.features.list.accounting.title',
                descKey: 'landing.features.list.accounting.description',
                color: 'text-orange-500'
              },
              {
                icon: Smartphone,
                titleKey: 'landing.features.list.mobile.title',
                descKey: 'landing.features.list.mobile.description',
                color: 'text-pink-500'
              },
              {
                icon: Briefcase,
                titleKey: 'landing.features.list.jobs.title',
                descKey: 'landing.features.list.jobs.description',
                color: 'text-indigo-500'
              },
              {
                icon: TrendingUp,
                titleKey: 'landing.features.list.analytics.title',
                descKey: 'landing.features.list.analytics.description',
                color: 'text-cyan-500'
              },
              {
                icon: Zap,
                titleKey: 'landing.features.list.automation.title',
                descKey: 'landing.features.list.automation.description',
                color: 'text-yellow-500'
              },
              {
                icon: Shield,
                titleKey: 'landing.features.list.security.title',
                descKey: 'landing.features.list.security.description',
                color: 'text-red-500'
              }
            ].map((feature, index) => (
              <Card 
                key={`feature-${index}`} 
                className="bg-white border-gray-200 hover:border-purple-600/50 transition-all hover:shadow-lg"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t(feature.titleKey)}</h3>
                  <p className="text-gray-600">{t(feature.descKey)}</p>
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
              <Badge className="bg-purple-100 text-purple-700 border-purple-300">{t('landing.benefits.badge')}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t('landing.benefits.title')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('landing.benefits.subtitle')}
              </p>

              <div className="space-y-6">
                {[
                  {
                    stat: t('landing.benefits.stats.noShows.value'),
                    label: t('landing.benefits.stats.noShows.label'),
                    description: t('landing.benefits.stats.noShows.description')
                  },
                  {
                    stat: t('landing.benefits.stats.timeSaved.value'),
                    label: t('landing.benefits.stats.timeSaved.label'),
                    description: t('landing.benefits.stats.timeSaved.description')
                  },
                  {
                    stat: t('landing.benefits.stats.bookings.value'),
                    label: t('landing.benefits.stats.bookings.label'),
                    description: t('landing.benefits.stats.bookings.description')
                  },
                  {
                    stat: t('landing.benefits.stats.roi.value'),
                    label: t('landing.benefits.stats.roi.label'),
                    description: t('landing.benefits.stats.roi.description')
                  }
                ].map((benefit, index) => (
                  <div key={`benefit-${index}`} className="flex gap-3 md:gap-4 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xl md:text-2xl font-bold text-purple-600 leading-tight">{benefit.stat}</span>
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
                {t('landing.benefits.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-l from-purple-200 to-purple-100 blur-3xl rounded-full pointer-events-none" />
              <Card className="relative bg-white border-gray-200 shadow-xl max-w-md mx-auto md:max-w-none">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-bold text-purple-600 mb-2">$1.250.000</div>
                    <div className="text-xl font-semibold text-gray-900 mb-2">{t('landing.benefits.calculator.lost')}</div>
                    <div className="text-sm text-gray-600">
                      {t('landing.benefits.calculator.lostDescription')}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900">{t('landing.benefits.calculator.withGestabiz')}</span>
                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">{t('landing.benefits.calculator.recovered')}</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('landing.benefits.calculator.appointmentsRecovered')}</span>
                        <span className="font-semibold text-gray-900">$875.000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('landing.benefits.calculator.cost')}</span>
                        <span className="font-semibold text-gray-900">-$79.900</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
                        <span className="font-bold text-gray-900">{t('landing.benefits.calculator.netProfit')}</span>
                        <span className="font-bold text-green-600">+$795.100</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/10 rounded-lg p-4 text-center">
                    <div className="text-sm text-green-700 font-semibold">
                      {t('landing.benefits.calculator.paysSelf')}
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
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">{t('landing.pricing.badge')}</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <PricingPlans showCTA={true} onSelectPlan={onNavigateToAuth} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-300">{t('landing.testimonials.badge')}</Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                nameKey: 'landing.testimonials.list.maria.name',
                businessKey: 'landing.testimonials.list.maria.business',
                textKey: 'landing.testimonials.list.maria.text',
                statKey: 'landing.testimonials.list.maria.stat',
                avatar: 'M',
                rating: 5
              },
              {
                nameKey: 'landing.testimonials.list.carlos.name',
                businessKey: 'landing.testimonials.list.carlos.business',
                textKey: 'landing.testimonials.list.carlos.text',
                statKey: 'landing.testimonials.list.carlos.stat',
                avatar: 'C',
                rating: 5
              },
              {
                nameKey: 'landing.testimonials.list.juan.name',
                businessKey: 'landing.testimonials.list.juan.business',
                textKey: 'landing.testimonials.list.juan.text',
                statKey: 'landing.testimonials.list.juan.stat',
                avatar: 'J',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={`testimonial-${index}`} className="relative overflow-hidden bg-white border-gray-200 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {[...new Array(testimonial.rating)].map((_, i) => (
                      <Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-600 italic">"{t(testimonial.textKey)}"</p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-bold text-purple-600">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{t(testimonial.nameKey)}</div>
                      <div className="text-sm text-gray-600">{t(testimonial.businessKey)}</div>
                    </div>
                  </div>

                  <Badge className="absolute top-4 right-4 bg-green-100 text-green-700 border-green-300">
                    {t(testimonial.statKey)}
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
                {t('landing.cta.title')}
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {t('landing.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-white/90 text-lg"
                  onClick={onNavigateToAuth}
                >
                  {t('landing.cta.buttons.trial')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg border-none shadow-md"
                  onClick={onNavigateToAuth}
                >
                  {t('landing.cta.buttons.login')}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{t('landing.cta.benefits.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{t('landing.cta.benefits.cancelAnytime')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{t('landing.cta.benefits.spanishSupport')}</span>
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
                {t('landing.footer.tagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">{t('landing.footer.product.title')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-purple-600">{t('landing.footer.product.features')}</a></li>
                <li><a href="#pricing" className="hover:text-purple-600">{t('landing.footer.product.pricing')}</a></li>
                <li><a href="/integrations" className="hover:text-purple-600">{t('landing.footer.product.integrations')}</a></li>
                <li><a href="/api" className="hover:text-purple-600">{t('landing.footer.product.api')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">{t('landing.footer.resources.title')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/blog" className="hover:text-purple-600">{t('landing.footer.resources.blog')}</a></li>
                <li><a href="/help" className="hover:text-purple-600">{t('landing.footer.resources.help')}</a></li>
                <li><a href="/tutorials" className="hover:text-purple-600">{t('landing.footer.resources.tutorials')}</a></li>
                <li><a href="/contact" className="hover:text-purple-600">{t('landing.footer.resources.contact')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">{t('landing.footer.legal.title')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/terms" className="hover:text-purple-600">{t('landing.footer.legal.terms')}</a></li>
                <li><a href="/privacy" className="hover:text-purple-600">{t('landing.footer.legal.privacy')}</a></li>
                <li><a href="/cookies" className="hover:text-purple-600">{t('landing.footer.legal.cookies')}</a></li>
                <li><a href="/licenses" className="hover:text-purple-600">{t('landing.footer.legal.licenses')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
              <p>{t('landing.footer.copyright')}</p>
              <p>{t('landing.footer.madeIn')}</p>
            </div>
            
            {/* Ti Turing Signature */}
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t('landing.footer.developedBy')}</span>
                <a 
                  href="https://tituring.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <img 
                    src={logoTiTuring} 
                    alt="Ti Turing Logo" 
                    className="h-6 w-6 object-contain"
                  />
                  <span className="font-semibold text-purple-600">{t('landing.footer.company')}</span>
                </a>
              </div>
              <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                {t('landing.footer.version')}
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}





