import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  X,
  Save,
  Loader2,
  Briefcase,
  Award,
  Languages,
  Link as LinkIcon,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmployeeProfile, type Certification } from '@/hooks/useEmployeeProfile';

interface EmployeeProfileSettingsProps {
  userId: string;
}

export const EmployeeProfileSettings: React.FC<EmployeeProfileSettingsProps> = ({ userId }) => {
  const { t } = useLanguage();
  const {
    profile,
    loading,
    updateProfile,
    addCertification,
    removeCertification,
    addSpecialization,
    removeSpecialization,
    addLanguage,
    removeLanguage,
  } = useEmployeeProfile(userId);

  // Form state
  const [professionalSummary, setProfessionalSummary] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [preferredWorkType, setPreferredWorkType] = useState<'full_time' | 'part_time' | 'contract' | 'flexible'>('full_time');
  const [availableForHire, setAvailableForHire] = useState(true);
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<number>(0);
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<number>(0);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // New item inputs
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [showCertificationForm, setShowCertificationForm] = useState(false);

  // Certification form state
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [certCredentialUrl, setCertCredentialUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setProfessionalSummary(profile.professional_summary || '');
      setYearsOfExperience(profile.years_of_experience || 0);
      setPreferredWorkType(profile.preferred_work_type || 'full_time');
      setAvailableForHire(profile.available_for_hire ?? true);
      setExpectedSalaryMin(profile.expected_salary_min || 0);
      setExpectedSalaryMax(profile.expected_salary_max || 0);
      setPortfolioUrl(profile.portfolio_url || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setValidationError(null);

      // Validations
      if (professionalSummary.trim().length < 50) {
        setValidationError(t('jobsUI.professionalSummaryMinLength'));
        return;
      }

      if (yearsOfExperience < 0 || yearsOfExperience > 50) {
        setValidationError('Los años de experiencia deben estar entre 0 y 50');
        return;
      }

      if (expectedSalaryMin > 0 && expectedSalaryMax > 0 && expectedSalaryMin > expectedSalaryMax) {
        setValidationError('El salario mínimo no puede ser mayor que el máximo');
        return;
      }

      await updateProfile({
        professional_summary: professionalSummary.trim(),
        years_of_experience: yearsOfExperience,
        preferred_work_type: preferredWorkType,
        available_for_hire: availableForHire,
        expected_salary_min: expectedSalaryMin > 0 ? expectedSalaryMin : undefined,
        expected_salary_max: expectedSalaryMax > 0 ? expectedSalaryMax : undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
      });

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) return;
    
    try {
      await addSpecialization(newSpecialization.trim());
      setNewSpecialization('');
      toast.success('Especialización agregada');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return;
    
    try {
      await addLanguage(newLanguage.trim());
      setNewLanguage('');
      toast.success('Idioma agregado');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleAddCertification = async () => {
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      toast.error('Nombre, emisor y fecha de emisión son requeridos');
      return;
    }

    try {
      await addCertification({
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issue_date: certIssueDate,
        expiry_date: certExpiryDate || undefined,
        credential_id: certCredentialId.trim() || undefined,
        credential_url: certCredentialUrl.trim() || undefined,
      });

      // Reset form
      setCertName('');
      setCertIssuer('');
      setCertIssueDate('');
      setCertExpiryDate('');
      setCertCredentialId('');
      setCertCredentialUrl('');
      setShowCertificationForm(false);
      toast.success('Certificación agregada');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleRemoveSpecialization = async (spec: string) => {
    try {
      await removeSpecialization(spec);
      toast.success('Especialización eliminada');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleRemoveLanguage = async (lang: string) => {
    try {
      await removeLanguage(lang);
      toast.success('Idioma eliminado');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const handleRemoveCertification = async (certId: string) => {
    try {
      await removeCertification(certId);
      toast.success('Certificación eliminada');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message);
    }
  };

  const formatSalary = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil Profesional</h1>
        <p className="text-muted-foreground">
          Completa tu perfil para que los empleadores te encuentren
        </p>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Información Básica
          </CardTitle>
          <CardDescription>Tu experiencia y tipo de trabajo preferido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen Profesional */}
          <div className="space-y-2">
            <Label htmlFor="professional-summary">
              {t('jobsUI.professionalSummary')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="professional-summary"
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              placeholder="Describe tu experiencia, habilidades y lo que te hace único como profesional..."
              className="min-h-[120px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {professionalSummary.length} / 50 caracteres mínimos
            </p>
          </div>

          {/* Años de Experiencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years-experience">Años de Experiencia</Label>
              <Input
                id="years-experience"
                type="number"
                min={0}
                max={50}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-type">Tipo de Trabajo Preferido</Label>
              <Select value={preferredWorkType} onValueChange={(v) => setPreferredWorkType(v as typeof preferredWorkType)}>
                <SelectTrigger id="work-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Tiempo Completo</SelectItem>
                  <SelectItem value="part_time">Medio Tiempo</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available-for-hire"
              checked={availableForHire}
              onChange={(e) => setAvailableForHire(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="available-for-hire" className="cursor-pointer">
              Disponible para contratación
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Expectativas Salariales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expectativas Salariales
          </CardTitle>
          <CardDescription>Opcional: Ayuda a los empleadores a hacerte ofertas adecuadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary-min">Salario Mínimo Esperado</Label>
              <Input
                id="salary-min"
                type="number"
                min={0}
                value={expectedSalaryMin}
                onChange={(e) => setExpectedSalaryMin(Number(e.target.value))}
                placeholder="2000000"
              />
              {expectedSalaryMin > 0 && (
                <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMin)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-max">Salario Máximo Esperado</Label>
              <Input
                id="salary-max"
                type="number"
                min={0}
                value={expectedSalaryMax}
                onChange={(e) => setExpectedSalaryMax(Number(e.target.value))}
                placeholder="5000000"
              />
              {expectedSalaryMax > 0 && (
                <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMax)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especializaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Especializaciones
          </CardTitle>
          <CardDescription>Tus áreas de experiencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.specializations?.map((spec, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {spec}
                <button
                  onClick={() => handleRemoveSpecialization(spec)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ej: Desarrollo Web, Marketing Digital..."
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
            />
            <Button onClick={handleAddSpecialization} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Idiomas
          </CardTitle>
          <CardDescription>Los idiomas que hablas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.languages?.map((lang, index) => (
              <Badge key={index} variant="outline" className="text-sm">
                {lang}
                <button
                  onClick={() => handleRemoveLanguage(lang)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ej: Español, Inglés..."
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
            />
            <Button onClick={handleAddLanguage} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Certificaciones
              </CardTitle>
              <CardDescription>Tus certificaciones profesionales</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertificationForm(!showCertificationForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Certification Form */}
          {showCertificationForm && (
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre de la certificación *"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                  />
                  <Input
                    placeholder="Emisor *"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de emisión *"
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de vencimiento"
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                  <Input
                    placeholder="ID de credencial"
                    value={certCredentialId}
                    onChange={(e) => setCertCredentialId(e.target.value)}
                  />
                  <Input
                    placeholder="URL de credencial"
                    value={certCredentialUrl}
                    onChange={(e) => setCertCredentialUrl(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCertification} size="sm">Guardar</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCertificationForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications List */}
          <div className="space-y-3">
            {profile?.certifications?.map((cert: Certification) => (
              <div key={cert.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>Emisión: {new Date(cert.issue_date).toLocaleDateString()}</span>
                      {cert.expiry_date && (
                        <span>• Vencimiento: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Ver credencial →
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCertification(cert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enlaces Externos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Enlaces Externos
          </CardTitle>
          <CardDescription>Portfolio, LinkedIn, GitHub, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="portfolio-url">Portfolio / Sitio Web</Label>
            <Input
              id="portfolio-url"
              type="url"
              placeholder="https://tu-portfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">LinkedIn</Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://linkedin.com/in/tu-perfil"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-url">GitHub</Label>
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/tu-usuario"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleSaveProfile} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
