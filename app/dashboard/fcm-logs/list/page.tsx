"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Search, ArrowUpDown, ChevronLeft, ChevronRight, Bell, Filter, CheckCircle, XCircle, Clock, Smartphone, RefreshCw, Download } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface PaginationInfo {
  count: number
  next: string | null
  previous: string | null
  results: any[]
}

export default function FcmLogsListPage() {
  const [paginationData, setPaginationData] = useState<PaginationInfo>({
    count: 0,
    next: null,
    previous: null,
    results: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deviceFilter, setDeviceFilter] = useState("all")
  const [sortField, setSortField] = useState<"created_at" | "device_id" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Calculate pagination info
  const totalPages = Math.ceil(paginationData.count / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, paginationData.count)

  useEffect(() => {
    const fetchFcmLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })
        
        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }
        if (deviceFilter !== "all") {
          params.append("device_id", deviceFilter)
        }
        if (sortField) {
          params.append("ordering", `${sortDirection}${sortField}`)
        }
        
        const query = params.toString().replace(/ordering=%2B/g, "ordering=+")
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/fcm-logs/?${query}`
        
        const data = await apiFetch(endpoint)
        
        // Handle both paginated and non-paginated responses
        if (data.results) {
          setPaginationData(data)
        } else {
          // Fallback for non-paginated response
          setPaginationData({
            count: Array.isArray(data) ? data.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(data) ? data : []
          })
        }
        
        toast({
          title: t("fcmLogs.success"),
          description: t("fcmLogs.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("fcmLogs.failedToLoad")
        setError(errorMessage)
        setPaginationData({
          count: 0,
          next: null,
          previous: null,
          results: []
        })
        toast({
          title: t("fcmLogs.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('FCM logs fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFcmLogs()
  }, [searchTerm, deviceFilter, sortField, sortDirection, currentPage, pageSize])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      toast({
        title: t("common.copied"),
        description: t("common.copiedToClipboard"),
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSort = (field: "created_at" | "device_id") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      })
      
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (deviceFilter !== "all") {
        params.append("device_id", deviceFilter)
      }
      if (sortField) {
        params.append("ordering", `${sortDirection}${sortField}`)
      }
      
      const query = params.toString().replace(/ordering=%2B/g, "ordering=+")
      const endpoint = `${baseUrl}/api/payments/fcm-logs/?${query}`
      
      const data = await apiFetch(endpoint)
      
      if (data.results) {
        setPaginationData(data)
      } else {
        setPaginationData({
          count: Array.isArray(data) ? data.length : 0,
          next: null,
          previous: null,
          results: Array.isArray(data) ? data : []
        })
      }
      
      toast({
        title: t("fcmLogs.success") || "Logs FCM actualisés",
        description: t("fcmLogs.loadedSuccessfully") || "Liste des logs FCM actualisée avec succès",
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("fcmLogs.failedToLoad") || "Échec du chargement des logs FCM"
      setError(errorMessage)
      toast({
        title: t("fcmLogs.failedToLoad") || "Échec du chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("fcmLogs.list") || "Logs FCM"}
          </h1>
          <p className="text-muted-foreground">
            Surveiller les journaux Firebase Cloud Messaging
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {paginationData.count} notifications
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

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les journaux FCM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Device Filter */}
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par appareil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les appareils</SelectItem>
                {/* Add device options here if available */}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select 
              value={sortField || ""} 
              onValueChange={(value) => setSortField(value as "created_at" | "device_id" | null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="device_id">Appareil</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Taille de page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
                <SelectItem value="200">200 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FCM Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Journaux FCM
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des journaux FCM...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <ErrorDisplay error={error} onRetry={handleRefresh} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Appareil</TableHead>
                    <TableHead className="font-semibold">Message</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginationData.results.map((log, index) => (
                    <TableRow key={log.id || log.uid || index} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.device_id || log.device || 'Inconnu'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-2xl">
                          <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {log.message || log.title || log.body || log.content || 'Aucun message'}
                          </div>
                          {log.data && (
                            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                              Données: {JSON.stringify(log.data, null, 2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            log.status === 'success' || log.status === 'delivered' ? "default" :
                            log.status === 'failed' || log.status === 'error' ? "destructive" :
                            "secondary"
                          }
                        >
                          <div className="flex items-center gap-1">
                            {log.status === 'success' || log.status === 'delivered' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : log.status === 'failed' || log.status === 'error' ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span>{log.status || 'Inconnu'}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {log.created_at 
                            ? new Date(log.created_at).toLocaleString()
                            : log.timestamp 
                            ? new Date(log.timestamp).toLocaleString()
                            : 'Inconnu'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(log, null, 2))}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {copied === JSON.stringify(log, null, 2) ? 'Copié!' : 'Copier'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {startItem} à {endItem} sur {paginationData.count} résultats
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && paginationData.results.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent mx-auto flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Aucun journal FCM trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? `Aucun journal FCM ne correspond à "${searchTerm}"` : "Aucun journal FCM n'a encore été enregistré."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}