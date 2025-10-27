"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { 
  Globe, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Settings, 
  CheckCircle, 
  Share2,
  Wifi,
  Smartphone
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function NetworkCreatePage() {
  const [nom, setNom] = useState("")
  const [code, setCode] = useState("")
  const [country, setCountry] = useState("")
  const [ussdBaseCode, setUssdBaseCode] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [sentDepositToModule, setSentDepositToModule] = useState(false)
  const [sentWithdrawalToModule, setSentWithdrawalToModule] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true)
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/countries/`)
        // Ensure countries is always an array
        const countriesArray = Array.isArray(data) 
          ? data 
          : (Array.isArray(data?.results) ? data.results : [])
        setCountries(countriesArray)
      } catch (err: any) {
        console.error("Error fetching countries:", err)
        setCountries([])
        toast({
          title: "Erreur",
          description: "Impossible de charger les pays",
          variant: "destructive",
        })
      } finally {
        setLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [apiFetch, toast])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`, {
        method: "POST",
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
        title: t("network.created"),
        description: t("network.createdSuccessfully"),
      })
      router.push("/dashboard/network/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("network.failedToCreate")
      setError(errorMessage)
      toast({
        title: t("network.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gradient">
              Créer un réseau
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Ajouter une nouvelle configuration de réseau de télécommunication
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Nouveau réseau
          </span>
        </div>
      </div>

      {error && (
        <Card className="minimal-card">
          <CardContent className="p-6">
            <ErrorDisplay error={error} />
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <span>Informations de base</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium text-foreground">
                  Nom du réseau *
                </Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: MTN, Orange, Airtel"
                  className="minimal-input"
                  variant="minimal"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le nom commercial du réseau de télécommunication
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-foreground">
                  Code du réseau *
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ex: MTN, ORG, AIR"
                  className="minimal-input font-mono"
                  variant="minimal"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Code unique pour identifier le réseau dans le système
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-foreground">
                  Pays *
                </Label>
                <Select value={country} onValueChange={setCountry} disabled={loadingCountries}>
                  <SelectTrigger className="minimal-input">
                    <SelectValue placeholder={loadingCountries ? "Chargement..." : "Sélectionner le pays"} />
                  </SelectTrigger>
                  <SelectContent className="minimal-card">
                    {Array.isArray(countries) && countries.length > 0 ? (
                      countries.map((country) => (
                        <SelectItem key={country.id || country.uid} value={(country.id || country.uid).toString()}>
                          {country.nom}
                        </SelectItem>
                      ))
                    ) : (
                      !loadingCountries && (
                        <SelectItem value="no-data" disabled>
                          Aucun pays disponible
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pays où ce réseau est opérationnel
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ussdBaseCode" className="text-sm font-medium text-foreground">
                  Code de base USSD
                </Label>
                <Input
                  id="ussdBaseCode"
                  value={ussdBaseCode}
                  onChange={(e) => setUssdBaseCode(e.target.value)}
                  placeholder="ex: *123#"
                  className="minimal-input font-mono"
                  variant="minimal"
                />
                <p className="text-xs text-muted-foreground">
                  Code USSD de base pour les services du réseau
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Settings className="h-5 w-5 text-blue-500" />
              </div>
              <span>Paramètres du réseau</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-sm font-medium text-foreground">
                    Statut du réseau
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Activer ce réseau pour qu'il soit disponible dans le système
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="sentDepositToModule" className="text-sm font-medium text-foreground">
                    Envoyer le dépôt au module
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Transmettre automatiquement les dépôts au module de traitement
                  </p>
                </div>
                <Switch
                  id="sentDepositToModule"
                  checked={sentDepositToModule}
                  onCheckedChange={setSentDepositToModule}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="sentWithdrawalToModule" className="text-sm font-medium text-foreground">
                    Envoyer le retrait au module
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Transmettre automatiquement les retraits au module de traitement
                  </p>
                </div>
                <Switch
                  id="sentWithdrawalToModule"
                  checked={sentWithdrawalToModule}
                  onCheckedChange={setSentWithdrawalToModule}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {(nom || code || country) && (
          <Card className="minimal-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 p-4 bg-accent/20 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {nom || "Nom du réseau"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Code: {code || "CODE"} • Pays: {Array.isArray(countries) && countries.find(c => (c.id || c.uid)?.toString() === country)?.nom || "Non sélectionné"}
                  </p>
                  {ussdBaseCode && (
                    <p className="text-xs text-muted-foreground font-mono">
                      USSD: {ussdBaseCode}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <div className="flex gap-1">
                    {sentDepositToModule && (
                      <Badge variant="success" className="text-xs">
                        <Wifi className="h-3 w-3 mr-1" />
                        Dépôt
                      </Badge>
                    )}
                    {sentWithdrawalToModule && (
                      <Badge variant="success" className="text-xs">
                        <Smartphone className="h-3 w-3 mr-1" />
                        Retrait
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            className="hover-lift"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={loading || loadingCountries || !nom || !code || !country}
            className="min-w-[140px] hover-lift"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer le réseau
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}