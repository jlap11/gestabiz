import { useEffect, useState } from 'react'
import { JobApplication } from '@/hooks/useJobApplications'
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Briefcase,
  Award,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ApplicantProfileModalProps {
  application: JobApplication
  open: boolean
  onClose: () => void
  onAccept: (id: string) => void
  onReject: (id: string) => void
}

export function ApplicantProfileModal({
  application,
  open,
  onClose,
  onAccept,
  onReject
}: Readonly<ApplicantProfileModalProps>) {
  const { t } = useLanguage()
  const { profile, loading, fetchProfile } = useEmployeeProfile()
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    if (open && application.user_id) {
      fetchProfile(application.user_id)
    }
  }, [open, application.user_id])

  const initials = application.applicant?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??'

  const appliedDate = application.created_at ? new Date(application.created_at) : null
  const isValidDate = appliedDate && !Number.isNaN(appliedDate.getTime())
  const timeAgo = isValidDate
    ? formatDistanceToNow(appliedDate, { addSuffix: true, locale: es })
    : 'Fecha no disponible'

  const workTypeLabels = {
    full_time: 'Tiempo Completo',
    part_time: 'Medio Tiempo',
    contract: 'Contrato',
    flexible: 'Flexible'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={application.applicant?.avatar_url}
                alt={application.applicant?.full_name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{application.applicant?.full_name}</h2>
              <p className="text-muted-foreground">Aplicación para: {application.vacancy?.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 py-4 border-b">
          {application.applicant?.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{application.applicant.email}</span>
            </div>
          )}
          {application.applicant?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{application.applicant.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Aplicó {timeAgo}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="experience">Experiencia</TabsTrigger>
            <TabsTrigger value="application">Aplicación</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando perfil...</p>
              </div>
            ) : !profile ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Este usuario aún no ha completado su perfil profesional
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Professional Summary */}
                {profile.professional_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('jobsUI.professionalSummary')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{profile.professional_summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Experience & Work Preferences */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Experience */}
                  {profile.years_of_experience !== null && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Experiencia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{profile.years_of_experience} años</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          de experiencia profesional
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Work Preferences */}
                  {profile.preferred_work_type && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Preferencia Laboral
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="secondary" className="text-sm">
                          {workTypeLabels[profile.preferred_work_type]}
                        </Badge>
                        {profile.available_for_hire && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            ✓ Disponible para contratación
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Salary Expectations */}
                {(profile.expected_salary_min || profile.expected_salary_max) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Expectativas Salariales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {profile.expected_salary_min && (
                          <span className="text-lg font-semibold">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(profile.expected_salary_min)}
                          </span>
                        )}
                        {profile.expected_salary_min && profile.expected_salary_max && (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {profile.expected_salary_max && (
                          <span className="text-lg font-semibold">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(profile.expected_salary_max)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Links */}
                {(profile.portfolio_url || profile.linkedin_url || profile.github_url) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Enlaces
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {profile.portfolio_url && (
                        <a
                          href={profile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Portafolio
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Github className="h-4 w-4" />
                          GitHub
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            ) : !profile ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Sin información de experiencia</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Specializations */}
                {profile.specializations && profile.specializations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Especializaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.specializations.map((spec, index) => (
                          <Badge key={index} variant="secondary">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {profile.languages && profile.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Idiomas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang, index) => (
                          <Badge key={index} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {profile.certifications && profile.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold">{cert.name}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Emitido: {new Date(cert.issue_date).toLocaleDateString('es-CO')}
                            </span>
                            {cert.expiry_date && (
                              <span>
                                Expira: {new Date(cert.expiry_date).toLocaleDateString('es-CO')}
                              </span>
                            )}
                          </div>
                          {cert.credential_url && (
                            <a
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              Ver credencial
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Application Tab */}
          <TabsContent value="application" className="space-y-6 mt-6">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles de la Aplicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.expected_salary && (
                  <div>
                    <Label className="text-sm text-muted-foreground">{t('jobsUI.expectedSalary')}</Label>
                    <p className="text-lg font-semibold mt-1">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: application.vacancy?.currency || 'COP',
                        minimumFractionDigits: 0
                      }).format(application.expected_salary)}
                    </p>
                  </div>
                )}

                {application.available_from && (
                  <div>
                    <Label className="text-sm text-muted-foreground">{t('jobsUI.availableFrom')}</Label>
                    <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      {new Date(application.available_from).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Cover Letter */}
                {application.cover_letter && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Carta de Presentación</Label>
                    <p className="text-sm leading-relaxed mt-2 p-4 bg-muted/50 rounded-lg">
                      {application.cover_letter}
                    </p>
                  </div>
                )}

                {/* Resume Link */}
                {application.cv_url && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Currículum</Label>
                    <a
                      href={application.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver currículum
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        {application.status === 'pending' && (
          <DialogFooter className="gap-3 sm:gap-3 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onReject(application.id)
                onClose()
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button
              onClick={() => {
                onAccept(application.id)
                onClose()
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aceptar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}
