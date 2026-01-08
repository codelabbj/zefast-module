"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  RefreshCw,
  Eye,
  BarChart3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EarningManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [earnings, setEarnings] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailEarning, setDetailEarning] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  // Fetch earnings from API
    const fetchEarnings = async () => {
      setLoading(true)
      setError("")
      try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (sortField) {
        params.append("ordering", `${sortDirection === "asc" ? "+" : "-"}${sortField}`)
      }
      
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/commission-payments/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      if (data.results) {
        setEarnings(data.results)
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } else {
        // Fallback for non-paginated response
        setEarnings(Array.isArray(data) ? data : [])
        setTotalCount(Array.isArray(data) ? data.length : 0)
        setTotalPages(1)
      }
      
      toast({ 
        title: t("earnings.success") || "Gains chargés", 
        description: t("earnings.loadedSuccessfully") || "Liste des gains chargée avec succès" 
      })
      } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      setEarnings([])
      setTotalCount(0)
      setTotalPages(1)
      toast({ 
        title: t("earnings.failedToLoad") || "Échec du chargement", 
        description: errorMessage, 
        variant: "destructive" 
      })
    } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchEarnings()
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection])

  const handleRefresh = async () => {
    await fetchEarnings()
  }

  const filteredEarnings = earnings // Filtering handled by API

  const handleSort = (field: "amount" | "created_at" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "warning",
      failed: "destructive"
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const handleOpenDetail = async (id: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailEarning(null)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/commission-payments/${id}/`
      const data = await apiFetch(endpoint)
      setDetailEarning(data)
      toast({ 
        title: t("earnings.detailLoaded") || "Détails chargés", 
        description: t("earnings.detailLoadedSuccessfully") || "Détails du gain chargés avec succès" 
      })
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ 
        title: t("earnings.detailFailed") || "Échec du chargement", 
        description: extractErrorMessages(err), 
        variant: "destructive" 
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailEarning(null)
    setDetailError("")
  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0)
  const paidEarnings = earnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0) // All commission payments are considered paid
  const pendingEarnings = 0 // Commission payments are always paid when created

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Gestion des gains
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Surveiller et gérer les commissions et gains des partenaires
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">
              {totalEarnings.toLocaleString()} XOF total
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {paidEarnings.toLocaleString()} XOF payés
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total des gains</p>
                <p className="text-2xl font-bold text-foreground">{totalEarnings.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">{earnings.length} gains</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Gains payés</p>
                <p className="text-2xl font-bold text-foreground">{paidEarnings.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    {totalEarnings > 0 ? Math.round((paidEarnings / totalEarnings) * 100) : 0}% du total
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-foreground">{pendingEarnings.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">
                    0 paiements
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Partenaires</p>
                <p className="text-2xl font-bold text-foreground">{earnings.length}</p>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">Actifs</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un partenaire..."
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
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
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

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Liste des gains
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des gains...</span>
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
                    <TableHead className="font-semibold">Partenaire</TableHead>
                    <TableHead className="font-semibold">Montant</TableHead>
                    <TableHead className="font-semibold">Période</TableHead>
                    <TableHead className="font-semibold">Référence</TableHead>
                    <TableHead className="font-semibold">Transactions</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEarnings.map((earning, index) => (
                    <TableRow key={earning.id || earning.uid || index} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {(earning.user_name || earning.partner_name || earning.display_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {earning.user_name || earning.partner_name || earning.display_name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {earning.uid || earning.id || index}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold text-foreground">
                          {earning.formatted_amount || `${(parseFloat(earning.amount) || 0).toLocaleString()} XOF`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {earning.period_start && earning.period_end ? 
                            `${new Date(earning.period_start).toLocaleDateString()} - ${new Date(earning.period_end).toLocaleDateString()}` : 
                            'N/A'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground font-mono">
                          {earning.reference || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {earning.transactions_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenDetail((earning.uid || earning.id || index).toString())}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} résultats
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

      {/* Earning Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du gain</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-4 text-center">Chargement...</div>
          ) : detailError ? (
            <ErrorDisplay
              error={detailError}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          ) : detailEarning ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Partenaire</label>
                  <span className="text-sm">{detailEarning.user_name || detailEarning.partner_name || detailEarning.display_name || 'N/A'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Payé par</label>
                  <span className="text-sm">{detailEarning.paid_by_name || 'N/A'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Montant</label>
                  <span className="text-lg font-semibold">{detailEarning.formatted_amount || `${(parseFloat(detailEarning.amount) || 0).toLocaleString()} XOF`}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nombre de transactions</label>
                  <span className="text-sm">{detailEarning.transactions_count || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Référence</label>
                  <span className="text-sm font-mono">{detailEarning.reference || 'N/A'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Période</label>
                  <span className="text-sm">
                    {detailEarning.period_start && detailEarning.period_end ? 
                      `${new Date(detailEarning.period_start).toLocaleDateString()} - ${new Date(detailEarning.period_end).toLocaleDateString()}` : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notes d'administrateur</label>
                <span className="text-sm">{detailEarning.admin_notes || 'Aucune note'}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                <span className="text-sm">{detailEarning.created_at ? new Date(detailEarning.created_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          ) : null}
          <DialogClose>
            <Button onClick={handleCloseDetail} className="w-full">
              Fermer
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}