"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { 
  Search, 
  Monitor, 
  Filter, 
  Download,
  RefreshCw,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useWebSocket } from "@/components/providers/websocket-provider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function DevicesListPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<"name" | "is_online" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)
  const { lastMessage } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState<any>(null)

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`${baseUrl}/api/payments/stats/devices/`)
        setDevices(data.results || data || [])
        toast({
          title: t("devices.loaded") || "Appareils chargés",
          description: t("devices.loadedSuccessfully") || "Liste des appareils chargée avec succès",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("devices.failedToLoad") || "Échec du chargement des appareils"
        setError(errorMessage)
        toast({
          title: t("devices.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection])

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)
        if (data.type === 'device_status_update') {
          setDevices(prev => prev.map(device => 
            device.id === data.device_id 
              ? { ...device, is_online: data.is_online, last_seen: data.last_seen }
              : device
          ))
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }, [lastMessage])

  const filteredDevices = useMemo(() => {
    let filtered = devices

    if (searchTerm) {
      filtered = filtered.filter(device =>
        Object.values(device).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(device => 
        statusFilter === "online" ? device.is_online : !device.is_online
      )
    }

    return filtered
  }, [devices, searchTerm, statusFilter])

  const handleSort = (field: "name" | "is_online") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "+" ? "-" : "+")
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`${baseUrl}/api/payments/stats/devices/`)
      setDevices(data.results || data || [])
      toast({
        title: t("devices.loaded") || "Appareils actualisés",
        description: t("devices.loadedSuccessfully") || "Liste des appareils actualisée avec succès",
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("devices.failedToLoad") || "Échec du chargement des appareils"
      setError(errorMessage)
      toast({
        title: t("devices.failedToLoad") || "Échec du chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDeviceData = (device: any) => {
    const formatValue = (key: string, value: any) => {
      if (value === null || value === undefined) return "Non disponible"
      
      // Format dates
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('seen')) {
        try {
          return new Date(value).toLocaleString()
        } catch {
          return value.toString()
        }
      }
      
      // Format booleans
      if (typeof value === 'boolean') {
        return value ? 'Oui' : 'Non'
      }
      
      // Format numbers
      if (typeof value === 'number') {
        if (key.toLowerCase().includes('level') || key.toLowerCase().includes('battery')) {
          return `${value}%`
        }
        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) {
          return `${value.toLocaleString()} FCFA`
        }
        return value.toLocaleString()
      }
      
      // Format objects
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      
      return value.toString()
    }

    const formatKey = (key: string) => {
      const keyMap: { [key: string]: string } = {
        'id': 'Identifiant',
        'device_id': 'ID de l\'appareil',
        'name': 'Nom',
        'device_name': 'Nom de l\'appareil',
        'is_online': 'Statut en ligne',
        'device_type': 'Type d\'appareil',
        'type': 'Type',
        'battery_level': 'Niveau de batterie',
        'location': 'Localisation',
        'address': 'Adresse',
        'last_seen': 'Dernière activité',
        'created_at': 'Date de création',
        'updated_at': 'Date de mise à jour',
        'status': 'Statut',
        'ip_address': 'Adresse IP',
        'mac_address': 'Adresse MAC',
        'os_version': 'Version du système',
        'app_version': 'Version de l\'application',
        'model': 'Modèle',
        'manufacturer': 'Fabricant'
      }
      
      return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return Object.entries(device).map(([key, value]) => ({
      label: formatKey(key),
      value: formatValue(key, value),
      key
    }))
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Appareils
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Surveiller et gérer les appareils connectés
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {filteredDevices.length} appareils
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {filteredDevices.filter(d => d.is_online).length} en ligne
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un appareil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                variant="minimal"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="online">En ligne</SelectItem>
                <SelectItem value="offline">Hors ligne</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres avancés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Liste des appareils
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des appareils...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <ErrorDisplay error={error} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Appareil</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device, index) => (
                    <TableRow key={device.id || device.device_id || index} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Monitor className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {device.name || device.device_name || device.device_id || `Device ${index + 1}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {device.id || device.device_id || index}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {device.is_online ? (
                            <>
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-sm text-green-600 dark:text-green-400">En ligne</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 bg-gray-400 rounded-full" />
                              <span className="text-sm text-muted-foreground">Hors ligne</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* <span className="text-sm text-muted-foreground">
                            {Object.keys(device).length} propriétés
                          </span> */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedDevice(device)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Monitor className="h-5 w-5 text-primary" />
                                  Détails de l'appareil
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {selectedDevice && formatDeviceData(selectedDevice).map((item, index) => (
                                  <div key={index} className="grid grid-cols-3 gap-4 p-3 bg-accent/50 rounded-lg">
                                    <div className="font-medium text-foreground">
                                      {item.label}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                      {item.value}
                          </div>
                        </div>
                                ))}
                        </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && filteredDevices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent mx-auto flex items-center justify-center">
                <Monitor className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Aucun appareil trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Aucun appareil ne correspond à vos critères de recherche."
                    : "Aucun appareil n'est actuellement connecté."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}