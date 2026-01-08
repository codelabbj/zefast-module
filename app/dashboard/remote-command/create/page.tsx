"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { WebSocketProvider, useWebSocket } from "@/components/providers/websocket-provider"
import { ArrowLeft, Save, Loader2, Zap, Smartphone, Settings, CheckCircle, AlertTriangle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function RemoteCommandCreatePage() {
  const [command, setCommand] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [parameters, setParameters] = useState("{}")
  const [priority, setPriority] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([])
  const { sendRemoteCommand } = useWebSocket();
  const router = useRouter();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/stats/devices/`)
        setDevices(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        setDevices([])
      }
    }
    fetchDevices()
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    let paramsObj = {}
    try {
      paramsObj = JSON.parse(parameters)
    } catch {
      setError(t("remoteCommand.parametersMustBeValidJson"))
      toast({
        title: t("remoteCommand.failed"),
        description: t("remoteCommand.parametersMustBeValidJson"),
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    try {
      // Send remote command via WebSocket
      sendRemoteCommand(deviceId, command, paramsObj, priority === 1 ? "normal" : String(priority));
      setSuccess(t("remoteCommand.commandSentSuccessfully"))
      toast({
        title: t("remoteCommand.success"),
        description: t("remoteCommand.commandSentSuccessfully"),
      })
      // Optionally, you can still send via API if needed
      // const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/remote-command/`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ command, device_id: deviceId, parameters: paramsObj, priority })
      // })
      // setSuccess(data.status || t("remoteCommand.commandSentSuccessfully"))
      // toast({
      //   title: t("remoteCommand.success"),
      //   description: data.status || t("remoteCommand.commandSentSuccessfully"),
      // })
    } catch (err: any) {
      const backendError = extractErrorMessages(err) || t("remoteCommand.failedToCreate")
      setError(backendError)
      toast({
        title: t("remoteCommand.failed"),
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300">{t("remoteCommand.sending") || "Envoi..."}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
                  {t("remoteCommand.create") || "Create Remote Command"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                  Envoyer des commandes aux appareils à distance
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

        {success && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Command Details */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <span>Détails de la commande</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="command" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("remoteCommand.command") || "Command"}
                </Label>
                <Input 
                  id="command"
                  value={command} 
                  onChange={e => setCommand(e.target.value)} 
                  placeholder="Entrer la commande à exécuter"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  required 
                />
              </div>
              <div>
                <Label htmlFor="deviceId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("remoteCommand.deviceId") || "Device ID"}
                </Label>
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder={t("remoteCommand.selectDeviceId") || "Sélectionner un appareil"} />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device: any) => (
                      <SelectItem key={device.device_id || device.uid} value={device.device_id || device.uid}>
                        {device.device_id || device.uid} {device.name ? `- ${device.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Settings className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <span>Paramètres</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="parameters" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("remoteCommand.parameters") || "Parameters (JSON)"}
                </Label>
                <Textarea 
                  id="parameters"
                  value={parameters} 
                  onChange={e => setParameters(e.target.value)} 
                  placeholder='{"key": "value"}'
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  rows={4}
                  required 
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Entrer des paramètres JSON valides pour la commande
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Priority Settings */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <span>Paramètres de priorité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("remoteCommand.priority") || "Priority Level"}
                </Label>
                <Input 
                  id="priority"
                  type="number" 
                  value={priority} 
                  onChange={e => setPriority(Number(e.target.value))} 
                  min="1"
                  max="10"
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  required 
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Niveau de priorité de 1 (le plus bas) à 10 (le plus élevé)
                </p>
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
                  {t("remoteCommand.sending") || "Envoi..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("remoteCommand.sendCommand") || "Envoyer la commande"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RemoteCommandCreatePageWrapper() {
  // Replace this with your actual logic to get the token, e.g., from context, props, or environment
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  return (
    <WebSocketProvider token={token}>
      <RemoteCommandCreatePage />
    </WebSocketProvider>
  );
}