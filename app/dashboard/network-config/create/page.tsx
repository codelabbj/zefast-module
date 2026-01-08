"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, Settings, Globe, MessageSquare, AlertTriangle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// Colors for consistent theming
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981', 
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function NetworkConfigCreatePage() {
  const router = useRouter()
  
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [network, setNetwork] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // USSD Commands
  const [ussdBalance, setUssdBalance] = useState("*880#\n1\n{pin}")
  const [ussdDeposit, setUssdDeposit] = useState("*880#\n2\n1\n{phone}\n{phone}\n{amount}\n{pin}")
  const [ussdWithdrawal, setUssdWithdrawal] = useState("*880#\n3\n1\n{phone}\n{phone}\n{amount}\n{object}\n{pin}")
  
  // SMS Keywords
  const [smsBalanceKeywords, setSmsBalanceKeywords] = useState("solde actuel, votre solde")
  const [smsDepositKeywords, setSmsDepositKeywords] = useState("depot effectue, retrait effectue")
  const [smsWithdrawalKeywords, setSmsWithdrawalKeywords] = useState("vous avez envoye, transfert effectue")
  
  // Error Keywords
  const [errorKeywords, setErrorKeywords] = useState("solde insuffisant, code incorrect, service indisponible")
  
  // Custom Settings
  const [timeoutSeconds, setTimeoutSeconds] = useState(30)
  const [maxRetries, setMaxRetries] = useState(3)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("networkConfig.networksLoaded"),
          description: t("networkConfig.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToLoadNetworks")
        setError(errorMessage)
        setNetworks([])
        toast({
          title: t("networkConfig.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchNetworks()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        network,
        ussd_commands: {
          balance: ussdBalance,
          deposit: ussdDeposit,
          withdrawal: ussdWithdrawal
        },
        sms_keywords: {
          balance: smsBalanceKeywords.split(',').map(k => k.trim()),
          deposit: smsDepositKeywords.split(',').map(k => k.trim()),
          withdrawal: smsWithdrawalKeywords.split(',').map(k => k.trim())
        },
        error_keywords: errorKeywords.split(',').map(k => k.trim()),
        is_active: isActive,
        custom_settings: {
          timeout_seconds: timeoutSeconds,
          max_retries: maxRetries,
          auto_confirm: autoConfirm
        }
      }
      
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/network-configs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      toast({
        title: t("networkConfig.created"),
        description: t("networkConfig.createdSuccessfully"),
      })
      
      router.push("/dashboard/network-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("networkConfig.failedToCreate")
      setError(errorMessage)
      toast({
        title: t("networkConfig.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("networkConfig.create") || "Create Network Configuration"}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
                  Ajouter une nouvelle configuration de réseau
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <ErrorDisplay error={error} />
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span>Paramètres de base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="network">Réseau</Label>
                  <Select value={network} onValueChange={setNetwork}>
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <SelectValue placeholder="Sélectionner le réseau" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((net) => (
                        <SelectItem key={net.id || net.uid} value={net.id || net.uid}>
                          {net.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* USSD Commands */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Globe className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <span>Commandes USSD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ussdBalance">Commande de solde</Label>
                  <Textarea
                    id="ussdBalance"
                    value={ussdBalance}
                    onChange={(e) => setUssdBalance(e.target.value)}
                    placeholder="*880#\n1\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdDeposit">Commande de dépôt</Label>
                  <Textarea
                    id="ussdDeposit"
                    value={ussdDeposit}
                    onChange={(e) => setUssdDeposit(e.target.value)}
                    placeholder="*880#\n2\n1\n{phone}\n{phone}\n{amount}\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="ussdWithdrawal">Commande de retrait</Label>
                  <Textarea
                    id="ussdWithdrawal"
                    value={ussdWithdrawal}
                    onChange={(e) => setUssdWithdrawal(e.target.value)}
                    placeholder="*880#\n3\n1\n{phone}\n{phone}\n{amount}\n{object}\n{pin}"
                    rows={3}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Keywords */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span>Mots-clés SMS</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="smsBalance">Mots-clés de solde (séparés par des virgules)</Label>
                  <Input
                    id="smsBalance"
                    value={smsBalanceKeywords}
                    onChange={(e) => setSmsBalanceKeywords(e.target.value)}
                    placeholder="solde actuel, votre solde"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="smsDeposit">Mots-clés de dépôt (séparés par des virgules)</Label>
                  <Input
                    id="smsDeposit"
                    value={smsDepositKeywords}
                    onChange={(e) => setSmsDepositKeywords(e.target.value)}
                    placeholder="depot effectue, retrait effectue"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="smsWithdrawal">Mots-clés de retrait (séparés par des virgules)</Label>
                  <Input
                    id="smsWithdrawal"
                    value={smsWithdrawalKeywords}
                    onChange={(e) => setSmsWithdrawalKeywords(e.target.value)}
                    placeholder="vous avez envoye, transfert effectue"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Keywords */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <span>Mots-clés d'erreur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="errorKeywords">Mots-clés d'erreur (séparés par des virgules)</Label>
                <Input
                  id="errorKeywords"
                  value={errorKeywords}
                  onChange={(e) => setErrorKeywords(e.target.value)}
                  placeholder="solde insuffisant, code incorrect, service indisponible"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <span>Paramètres personnalisés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeoutSeconds">Délai d'attente (secondes)</Label>
                  <Input
                    id="timeoutSeconds"
                    type="number"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 30)}
                    min="1"
                    max="300"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="maxRetries">Tentatives maximales</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value) || 3)}
                    min="1"
                    max="10"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoConfirm"
                    checked={autoConfirm}
                    onCheckedChange={setAutoConfirm}
                  />
                  <Label htmlFor="autoConfirm">Confirmation automatique</Label>
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
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la configuration
                </>
              )}
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
} 