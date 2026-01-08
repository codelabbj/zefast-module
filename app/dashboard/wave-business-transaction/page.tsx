"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Eye, 
  DollarSign, 
  Phone, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Download,
  RefreshCw,
  Waves,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

interface WaveBusinessTransaction {
  uid: string
  amount: string
  amount_as_integer: number
  recipient_phone: string
  status: "pending" | "confirmed" | "cancelled" | "expired" | "failed"
  reference: string
  created_by: number
  fcm_notifications: Array<{
    data: {
      date: string
      time: string
      phone: string
      amount: number
      sender_name: string
      original_body: string
    }
    timestamp: string
  }>
  callback_url: string
  confirmed_at: string | null
  expires_at: string
  is_expired: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse {
  count: number
  next: string | null
  previous: string | null
  results: WaveBusinessTransaction[]
}

export default function WaveBusinessTransactionPage() {
  const [transactions, setTransactions] = useState<WaveBusinessTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<WaveBusinessTransaction | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  
  const apiFetch = useApi()
  const { toast } = useToast()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "10",
      })
      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm)
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/wave-business-transactions/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      if (data.results) {
        setTransactions(data.results)
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / 10))
      } else {
        // Fallback for non-paginated response
        setTransactions(Array.isArray(data) ? data : [])
        setTotalCount(Array.isArray(data) ? data.length : 0)
        setTotalPages(1)
      }
      
      toast({ 
        title: "Transactions chargées", 
        description: "Liste des transactions Wave Business chargée avec succès" 
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
      setTotalPages(1)
      toast({ 
        title: "Échec du chargement", 
        description: errorMessage, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection])

  const handleRefresh = async () => {
    await fetchTransactions()
  }

  const filteredTransactions = transactions // Filtering handled by API

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
      confirmed: "default",
      pending: "warning",
      cancelled: "destructive",
      expired: "secondary"
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailTransaction(null)
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/wave-business-transactions/${uid}/`
      const data = await apiFetch(endpoint)
      setDetailTransaction(data)
      toast({ 
        title: "Détails chargés", 
        description: "Détails de la transaction chargés avec succès" 
      })
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ 
        title: "Échec du chargement", 
        description: extractErrorMessages(err), 
        variant: "destructive" 
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailTransaction(null)
    setDetailError("")
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copié!",
        description: "Le texte a été copié dans le presse-papiers",
      })
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte",
        variant: "destructive",
      })
    }
  }

  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
  const confirmedAmount = transactions.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
  const pendingAmount = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Wave Business Transactions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Surveiller et gérer les transactions Wave Business
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Waves className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount.toLocaleString()} transactions
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {confirmedAmount.toLocaleString()} XOF confirmées
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total des transactions</p>
                <p className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8% ce mois</span>
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
                <p className="text-sm font-medium text-muted-foreground">Confirmées</p>
                <p className="text-2xl font-bold text-foreground">{confirmedAmount.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    {Math.round((confirmedAmount / totalAmount) * 100)}% du total
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
                <p className="text-2xl font-bold text-foreground">{pendingAmount.toLocaleString()} XOF</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-yellow-500">
                    {transactions.filter(t => t.status === 'pending').length} transactions
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
                <p className="text-sm font-medium text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((confirmedAmount / totalAmount) * 100)}%
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+5% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
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
                placeholder="Rechercher une transaction..."
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
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
              </SelectContent>
            </Select>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            Liste des transactions Wave
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des transactions...</span>
              </div>
            </div>
            ) : error ? (
              <div className="p-6 text-center">
                <ErrorDisplay 
                  error={error} 
                  onRetry={handleRefresh}
                  className="mb-4"
                />
              </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Transaction</TableHead>
                    <TableHead className="font-semibold">Montant</TableHead>
                    <TableHead className="font-semibold">Destinataire</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Référence</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.uid} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Waves className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {transaction.uid}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {transaction.uid.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-lg font-semibold text-foreground">
                          {parseFloat(transaction.amount || '0').toLocaleString()} XOF
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground font-mono">
                            {transaction.recipient_phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground font-mono">
                          {transaction.reference}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(transaction.uid)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenDetail(transaction.uid)}
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
            Affichage de {((currentPage - 1) * 10) + 1} à {Math.min(currentPage * 10, totalCount)} sur {totalCount} résultats
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

      {/* Transaction Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la transaction Wave</DialogTitle>
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
          ) : detailTransaction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">UID</label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{detailTransaction.uid}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(detailTransaction.uid)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  {getStatusBadge(detailTransaction.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Montant</label>
                  <span className="text-lg font-semibold">{parseFloat(detailTransaction.amount || '0').toLocaleString()} XOF</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone destinataire</label>
                  <span className="text-sm font-mono">{detailTransaction.recipient_phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Référence</label>
                  <span className="text-sm font-mono">{detailTransaction.reference}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Créé par</label>
                  <span className="text-sm">User ID: {detailTransaction.created_by}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">URL de callback</label>
                <span className="text-sm break-all">{detailTransaction.callback_url}</span>
              </div>

              {detailTransaction.fcm_notifications && detailTransaction.fcm_notifications.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Notifications FCM</label>
                  <div className="space-y-2">
                    {detailTransaction.fcm_notifications.map((notification, index) => (
                      <div key={index} className="p-3 bg-accent rounded-lg">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Expéditeur:</strong> {notification.data.sender_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {notification.data.original_body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <span className="text-sm">{new Date(detailTransaction.created_at).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
                  <span className="text-sm">{new Date(detailTransaction.updated_at).toLocaleString()}</span>
                </div>
              </div>

              {detailTransaction.confirmed_at && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Confirmé le</label>
                  <span className="text-sm">{new Date(detailTransaction.confirmed_at).toLocaleString()}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Expire le</label>
                <span className="text-sm">{new Date(detailTransaction.expires_at).toLocaleString()}</span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={handleCloseDetail} className="w-full">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}