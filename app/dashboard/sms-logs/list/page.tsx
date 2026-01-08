"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  Download,
  RefreshCw
} from "lucide-react"
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

export default function SmsLogsListPage(): JSX.Element {
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
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"created_at" | "phone_number" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSmsLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: "20",
        })
        
        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }
        if (typeFilter !== "all") {
          params.append("type", typeFilter)
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter)
        }
        if (sortField) {
          params.append("ordering", `${sortDirection}${sortField}`)
        }
        
        const query = params.toString().replace(/ordering=%2B/g, "ordering=+")
        const endpoint = `${baseUrl}/api/payments/sms-logs/?${query}`
        
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
          title: t("smsLogs.success") || "Logs SMS chargés",
          description: t("smsLogs.loadedSuccessfully") || "Liste des logs SMS chargée avec succès",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("smsLogs.failedToLoad") || "Échec du chargement des logs SMS"
        setError(errorMessage)
        setPaginationData({
          count: 0,
          next: null,
          previous: null,
          results: []
        })
        toast({
          title: t("smsLogs.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
        console.error('SMS logs fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSmsLogs()
  }, [searchTerm, typeFilter, statusFilter, currentPage, sortField, sortDirection])

  const filteredLogs = useMemo(() => {
    let filtered = paginationData.results

    if (searchTerm) {
      filtered = filtered.filter(log =>
        Object.values(log).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter)
    }

    return filtered
  }, [paginationData.results, searchTerm, typeFilter, statusFilter])

  const handleSort = (field: "created_at" | "phone_number") => {
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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "20",
      })
      
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (sortField) {
        params.append("ordering", `${sortDirection}${sortField}`)
      }
      
      const query = params.toString().replace(/ordering=%2B/g, "ordering=+")
      const endpoint = `${baseUrl}/api/payments/sms-logs/?${query}`
      
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
        title: t("smsLogs.success") || "Logs SMS actualisés",
        description: t("smsLogs.loadedSuccessfully") || "Liste des logs SMS actualisée avec succès",
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("smsLogs.failedToLoad") || "Échec du chargement des logs SMS"
      setError(errorMessage)
      toast({
        title: t("smsLogs.failedToLoad") || "Échec du chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "default",
      delivered: "success",
      failed: "destructive",
      pending: "warning"
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      verification: "info",
      notification: "default",
      error: "destructive",
      welcome: "success"
    } as const

    return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast({
        title: "Copié!",
        description: "Le texte a été copié dans le presse-papiers",
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Logs SMS
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Surveiller et analyser les messages SMS envoyés
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {paginationData.count.toLocaleString()} messages
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {filteredLogs.filter(log => log.status === 'delivered').length} livrés
            </span>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="touch-manipulation">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un SMS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
                variant="minimal"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="verification">Vérification</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="welcome">Bienvenue</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-10">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtres avancés</span>
                <span className="sm:hidden">Filtres</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Logs Table */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquare className="h-5 w-5 text-primary" />
            Liste des logs SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 px-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground text-center">Chargement des logs SMS...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-center">
              <ErrorDisplay error={error} />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold min-w-[120px]">Numéro</TableHead>
                      <TableHead className="font-semibold min-w-[200px]">Message</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Type</TableHead>
                      <TableHead className="font-semibold min-w-[100px]">Statut</TableHead>
                      <TableHead className="font-semibold min-w-[80px]">Coût</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Date</TableHead>
                      <TableHead className="font-semibold text-right min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log, index) => {
                      const phoneNumber = log.phone_number || log.phone || log.recipient || "N/A";
                      const senderValue = log.sender || log.from || log.originator || log.sender_name || "";

                      return (
                        <TableRow key={log.id || index} className="hover:bg-accent/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm text-foreground">
                                  {phoneNumber}
                                </span>
                              </div>
                              {senderValue && (
                                <p className="text-xs text-muted-foreground">
                                  Expéditeur&nbsp;: <span className="font-medium text-foreground">{senderValue}</span>
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs sm:max-w-2xl">
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words line-clamp-2">
                                {log.message || log.content || log.text || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(log.type || log.message_type || "unknown")}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status || log.delivery_status || "unknown")}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-foreground">
                              {log.cost ? `€${log.cost.toFixed(2)}` : log.price ? `€${log.price.toFixed(2)}` : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {log.created_at ? new Date(log.created_at).toLocaleString() :
                                 log.timestamp ? new Date(log.timestamp).toLocaleString() :
                                 log.date ? new Date(log.date).toLocaleString() : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(log.message || log.content || log.text || "", (log.id || index).toString())}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {paginationData.count > 10 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Affichage de {((currentPage - 1) * 10) + 1} à {Math.min(currentPage * 10, paginationData.count)} sur {paginationData.count} résultats
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="sm:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(paginationData.count / 10)) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px] h-10"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(Math.ceil(paginationData.count / 10), currentPage + 1))}
              disabled={currentPage === Math.ceil(paginationData.count / 10)}
              className="hidden sm:flex"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(Math.ceil(paginationData.count / 10), currentPage + 1))}
              disabled={currentPage === Math.ceil(paginationData.count / 10)}
              className="sm:hidden"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent mx-auto flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Aucun log SMS trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                    ? "Aucun log SMS ne correspond à vos critères de recherche."
                    : "Aucun message SMS n'a été envoyé récemment."
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