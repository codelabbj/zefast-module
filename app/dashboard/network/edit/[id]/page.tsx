"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, Globe, Settings } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// Colors for consistent theming - using logo colors
const COLORS = {
  primary: '#FF6B35', // Orange (primary from logo)
  secondary: '#00FF88', // Bright green from logo
  accent: '#1E3A8A', // Dark blue from logo
  danger: '#EF4444',
  warning: '#F97316',
  success: '#00FF88', // Using bright green for success
  info: '#1E3A8A', // Using dark blue for info
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function NetworkEditPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [nom, setNom] = useState("")
  const [code, setCode] = useState("")
  const [country, setCountry] = useState("")
  const [ussdBaseCode, setUssdBaseCode] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [sentDepositToModule, setSentDepositToModule] = useState(false)
  const [sentWithdrawalToModule, setSentWithdrawalToModule] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/countries/`)
        setCountries(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.countriesLoaded"),
          description: t("network.countriesLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoadCountries")
        setCountries([])
        toast({
          title: t("network.countriesFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchCountries()
  }, [])

  useEffect(() => {
    if (!id) return
    
    const fetchNetwork = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/${id}/`)
        setNom(data.nom || "")
        setCode(data.code || "")
        setCountry(data.country || "")
        setUssdBaseCode(data.ussd_base_code || "")
        setIsActive(data.is_active)
        setSentDepositToModule(!!data.sent_deposit_to_module)
        setSentWithdrawalToModule(!!data.sent_withdrawal_to_module)
        toast({
          title: t("network.loaded"),
          description: t("network.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoad")
        setError(errorMessage)
        toast({
          title: t("network.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchNetwork()
  }, [id])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nom, 
          code, 
          country, 
          ussd_base_code: ussdBaseCode, 
          is_active: isActive,
          sent_deposit_to_module: sentDepositToModule,
          sent_withdrawal_to_module: sentWithdrawalToModule
        })
      })
      toast({
        title: t("network.updated"),
        description: t("network.updatedSuccessfully"),
      })
      router.push("/dashboard/network/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("network.failedToUpdate")
      setError(errorMessage)
      toast({
        title: t("network.failedToUpdate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="h-6 sm:h-8 w-32 sm:w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="h-5 sm:h-6 w-24 sm:w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse self-start sm:self-auto" />
        </div>
        
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover-lift touch-manipulation self-start"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {t("network.edit") || "Edit Network"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Mettre à jour la configuration du réseau
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Settings className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              ID: {id}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {error && (
        <ErrorDisplay error={error} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Informations de base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom du réseau</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: MTN, Orange, Airtel"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Code du réseau</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ex: MTN, ORG, AIR"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id || country.uid} value={country.id || country.uid}>
                        {country.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ussdBaseCode">Code de base USSD</Label>
                <Input
                  id="ussdBaseCode"
                  value={ussdBaseCode}
                  onChange={(e) => setUssdBaseCode(e.target.value)}
                  placeholder="ex: *123#"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Actif</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sentDepositToModule"
                  checked={sentDepositToModule}
                  onCheckedChange={setSentDepositToModule}
                />
                <Label htmlFor="sentDepositToModule">Envoyer le dépôt au module</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sentWithdrawalToModule"
                  checked={sentWithdrawalToModule}
                  onCheckedChange={setSentWithdrawalToModule}
                />
                <Label htmlFor="sentWithdrawalToModule">Envoyer le retrait au module</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 