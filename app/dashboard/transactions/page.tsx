"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  TrendingDown,
  Download,
  RefreshCw,
  ArrowUpDown,
  Pencil,
  Trash
} from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useWebSocket } from "@/components/providers/websocket-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://connect.api.blaffa.net"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const { toast } = useToast()
  const apiFetch = useApi()
  const router = useRouter()
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editTransaction, setEditTransaction] = useState<any | null>(null)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [pendingEditPayload, setPendingEditPayload] = useState<any | null>(null)
  
  // Delete state
  const [deleteUid, setDeleteUid] = useState<string | null>(null)
  
  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  
  // Retry modal state
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [retryReason, setRetryReason] = useState("")
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState("")
  const [retryTransaction, setRetryTransaction] = useState<any | null>(null)
  
  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState("")
  const [cancelTransaction, setCancelTransaction] = useState<any | null>(null)
  
  // Mark as success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successReason, setSuccessReason] = useState("")
  const [successLoading, setSuccessLoading] = useState(false)
  const [successError, setSuccessError] = useState("")
  const [successTransaction, setSuccessTransaction] = useState<any | null>(null)
  
  // Mark as failed modal state
  const [failedModalOpen, setFailedModalOpen] = useState(false)
  const [failedReason, setFailedReason] = useState("")
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedError, setFailedError] = useState("")
  const [failedTransaction, setFailedTransaction] = useState<any | null>(null)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    status: "",
    external_transaction_id: "",
    balance_before: "",
    balance_after: "",
    fees: "",
    confirmation_message: "",
    raw_sms: "",
    completed_at: "",
    error_message: "",
  })

  // Helper function to add timeout to API calls
  const apiWithTimeout = async (url: string, timeoutMs: number = 10000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
    
    return Promise.race([
      apiFetch(url),
      timeoutPromise
    ])
  }

  // Helper function to retry API calls with exponential backoff
  const apiWithRetry = async (url: string, options: any = {}, maxRetries: number = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (Object.keys(options).length > 0) {
          return await apiFetch(url, options)
        } else {
          return await apiWithTimeout(url, 10000)
        }
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff: wait 1s, then 2s, then 4s
        const delay = Math.pow(2, attempt) * 1000
        console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true)
    setError("")
    try {
      // Check if baseUrl is set
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_API_BASE_URL is not set')
        setError('URL de base de l\'API non configurée')
        setLoading(false)
        return
      }

      console.log('Fetching transactions from:', baseUrl)

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      })

      if (searchTerm.trim() !== "") {
        params.append("search", searchTerm.trim())
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (typeFilter !== "all") {
        params.append("trans_type", typeFilter)
      }
      if (sortField) {
        const orderBy = sortField === "created_at" ? "created_at" : sortField
        const prefix = sortDirection === "desc" ? "-" : "+"
        params.append("ordering", `${prefix}${orderBy}`)
      }

      const endpoint = `${baseUrl}/api/payments/transactions/?${params.toString()}`
      const data = await apiWithRetry(endpoint)
      
      setTransactions(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      
      toast({
        title: "Transactions chargées",
        description: `${data.count || 0} transactions trouvées`,
      })
    } catch (err: any) {
      console.error('Transactions fetch error:', err)
      
      // Check if error is due to timeout
      if (err?.message?.includes('Request timeout')) {
        toast({
          title: "Timeout des requêtes",
          description: "Les requêtes ont expiré. Vérifiez votre connexion réseau.",
          variant: "destructive",
        })
      }
      
      const errorMessage = err?.message || "Échec du chargement des transactions"
      setError(errorMessage)
      setTransactions([])
      setTotalCount(0)
      setTotalPages(1)
      
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [searchTerm, statusFilter, typeFilter, currentPage, sortField, sortDirection])

  const handleSort = (field: "amount" | "created_at" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending:      { label: "En attente", color: "#ffc107" },      // jaune
      sent_to_user: { label: "Envoyé", color: "#17a2b8" },          // bleu clair
      processing:   { label: "En cours", color: "#fd7e14" },        // orange
      completed:    { label: "Terminé", color: "#28a745" },         // vert foncé
      success:      { label: "Succès", color: "#20c997" },          // turquoise
      failed:       { label: "Échec", color: "#dc3545" },           // rouge
      cancelled:    { label: "Annulé", color: "#6c757d" },          // gris
      timeout:      { label: "Expiré", color: "#6f42c1" },          // violet
    }

    const info = statusMap[status] || { label: status, color: "#adb5bd" }
    return (
      <span
        style={{
          backgroundColor: info.color,
          color: "#fff",
          borderRadius: "0.375rem",
          padding: "0.25em 0.75em",
          fontWeight: 500,
          fontSize: "0.875rem",
          display: "inline-block",
        }}
      >
        {info.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      withdrawal: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    }
    return <Badge className={colors[type] || ""}>{type}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "transfer":
        return <CreditCard className="h-4 w-4 text-blue-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setSelectedTransaction(null)
    try {
      if (!baseUrl) {
        setDetailError('URL de base de l\'API non configurée')
        setDetailLoading(false)
        return
      }

      const endpoint = `${baseUrl}/api/payments/transactions/${uid}/`
      const transaction = await apiWithRetry(endpoint)
      setSelectedTransaction(transaction)
      setDetailLoading(false)
    } catch (err: any) {
      console.error('Transaction detail fetch error:', err)
      
      if (err?.message?.includes('Request timeout')) {
        toast({
          title: "Timeout des requêtes",
          description: "La requête a expiré. Vérifiez votre connexion réseau.",
          variant: "destructive",
        })
      }
      
      const errorMessage = err?.message || "Échec du chargement des détails de la transaction"
      setDetailError(errorMessage)
      setDetailLoading(false)
      
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setSelectedTransaction(null)
    setDetailError("")
  }

  // Listen for transaction_update WebSocket messages
  const { lastMessage } = useWebSocket()
  useEffect(() => {
    if (!lastMessage) return
    try {
      const data = typeof lastMessage.data === "string" ? JSON.parse(lastMessage.data) : lastMessage.data

      // Handle new transaction creation
      if (data.type === "new_transaction" && data.event === "transaction_created" && data.transaction_data) {
        const newTx = data.transaction_data
        // If user is on page 1, show it immediately on top; otherwise, just bump count
        setTransactions(prev => (currentPage === 1 ? [newTx, ...prev].slice(0, itemsPerPage) : prev))
        setTotalCount(prev => prev + 1)
        toast({
          title: "Nouvelle transaction",
          description: `Transaction ${newTx.uid} créée avec succès`,
        })
        return
      }

      // Handle live transaction updates
      if (data.type === "transaction_update" && data.transaction_uid) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.uid === data.transaction_uid
              ? { ...tx, status: data.status, ...data.data }
              : tx
          )
        )
        toast({
          title: "Mise à jour en temps réel",
          description: `Transaction ${data.transaction_uid} mise à jour: ${data.status}`,
        })
        return
      }

      // Handle system events
      if (data.type === "system_event" && data.event === "system_event_created") {
        toast({
          title: "Événement système",
          description: data.message || data?.event_data?.description || "",
        })
        return
      }
    } catch (err) {
      console.error('WebSocket message parse error:', err)
    }
  }, [lastMessage, toast, currentPage, itemsPerPage])

  // Refresh function for manual refresh button
  const handleRefresh = async () => {
    await fetchTransactions()
    toast({
      title: "Actualisation",
      description: "Les transactions ont été actualisées",
    })
  }

  // Extract a user uid from transaction, trying several likely fields
  const extractUserUid = (tx: any): string | null => {
    return tx?.user_uid || tx?.user_id || tx?.user?.uid || tx?.owner_uid || null
  }

  // Assign transaction to its user
  const handleAssign = async (tx: any) => {
    const userUid = extractUserUid(tx)
    if (!userUid) {
      toast({
        title: "Échec de l'assignation",
        description: "ID utilisateur non trouvé sur cette transaction.",
        variant: "destructive",
      })
      return
    }
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${tx.uid}/assign/`
      await apiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_uid: userUid }),
      })
      toast({
        title: "Assigné",
        description: "Transaction assignée avec succès.",
      })
      // Refresh list
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = err?.message || "Échec de l'assignation de la transaction"
      toast({ title: "Échec de l'assignation", description: errorMessage, variant: "destructive" })
    }
  }

  // Open edit modal and populate form
  const handleOpenEdit = (transaction: any) => {
    setEditTransaction(transaction)
    setEditForm({
      status: transaction.status || "",
      external_transaction_id: transaction.external_transaction_id || "",
      balance_before: transaction.balance_before || "",
      balance_after: transaction.balance_after || "",
      fees: transaction.fees || "",
      confirmation_message: transaction.confirmation_message || "",
      raw_sms: transaction.raw_sms || "",
      completed_at: transaction.completed_at || "",
      error_message: transaction.error_message || "",
    })
    setEditModalOpen(true)
    setEditError("")
  }

  // Handle edit form change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit edit -> open confirm modal
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTransaction) return
    const payload = { ...editForm }
    setPendingEditPayload(payload)
    setShowEditConfirm(true)
  }

  // Confirm and send PATCH
  const confirmEditAndSend = async () => {
    if (!editTransaction || !pendingEditPayload) return
    setEditLoading(true)
    setEditError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${editTransaction.uid}/`
      await apiWithRetry(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingEditPayload),
      })
      toast({ title: "Modification réussie", description: "Transaction mise à jour avec succès" })
      setShowEditConfirm(false)
      setPendingEditPayload(null)
      setEditModalOpen(false)
      setEditTransaction(null)
      setEditForm({
        status: "",
        external_transaction_id: "",
        balance_before: "",
        balance_after: "",
        fees: "",
        confirmation_message: "",
        raw_sms: "",
        completed_at: "",
        error_message: "",
      })
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const backendError = err?.message || "Échec de la modification"
      setEditError(backendError)
      toast({ title: "Échec de la modification", description: backendError, variant: "destructive" })
    } finally {
      setEditLoading(false)
    }
  }

  // Delete transaction
  const handleDelete = async () => {
    if (!deleteUid) return
    setLoading(true)
    setError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${deleteUid}/`
      await apiWithRetry(endpoint, { method: "DELETE" })
      toast({
        title: "Suppression réussie",
        description: "Transaction supprimée avec succès",
      })
      setDeleteUid(null)
      // Refetch transactions
      setCurrentPage(1)
      await fetchTransactions()
    } catch (err: any) {
      const backendError = err?.message || "Échec de la suppression"
      setError(backendError)
      toast({
        title: "Échec de la suppression",
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Open retry modal
  const openRetryModal = (tx: any) => {
    setRetryTransaction(tx)
    setRetryReason("")
    setRetryError("")
    setRetryModalOpen(true)
  }

  // Submit retry request
  const handleRetrySubmit = async () => {
    if (!retryTransaction) return
    if (!retryReason.trim()) {
      setRetryError("La raison est requise")
      return
    }
    setRetryLoading(true)
    setRetryError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${retryTransaction.uid}/retry/`
      await apiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: retryReason.trim() }),
      })
      toast({
        title: "Relance en file d'attente",
        description: "Demande de relance envoyée avec succès.",
      })
      setRetryModalOpen(false)
      setRetryTransaction(null)
      setRetryReason("")
      // Refresh list
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = err?.message || "Échec de la relance de la transaction"
      setRetryError(errorMessage)
      toast({ title: "Échec de la relance", description: errorMessage, variant: "destructive" })
    } finally {
      setRetryLoading(false)
    }
  }

  // Open/submit cancel
  const openCancelModal = (tx: any) => {
    setCancelTransaction(tx)
    setCancelReason("")
    setCancelError("")
    setCancelModalOpen(true)
  }

  const handleCancelSubmit = async () => {
    if (!cancelTransaction) return
    if (!cancelReason.trim()) {
      setCancelError("La raison est requise")
      return
    }
    setCancelLoading(true)
    setCancelError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${cancelTransaction.uid}/cancel/`
      await apiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      })
      toast({
        title: "Annulation en file d'attente",
        description: "Demande d'annulation envoyée avec succès.",
      })
      setCancelModalOpen(false)
      setCancelTransaction(null)
      setCancelReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = err?.message || "Échec de l'annulation de la transaction"
      setCancelError(errorMessage)
      toast({ title: "Échec de l'annulation", description: errorMessage, variant: "destructive" })
    } finally {
      setCancelLoading(false)
    }
  }

  // Open/submit success
  const openSuccessModal = (tx: any) => {
    setSuccessTransaction(tx)
    setSuccessReason("")
    setSuccessError("")
    setSuccessModalOpen(true)
  }

  const handleSuccessSubmit = async () => {
    if (!successTransaction) return
    if (!successReason.trim()) {
      setSuccessError("La raison est requise")
      return
    }
    setSuccessLoading(true)
    setSuccessError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${successTransaction.uid}/success/`
      await apiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: successReason.trim() }),
      })
      toast({
        title: "Succès en file d'attente",
        description: "Mise à jour de succès envoyée avec succès.",
      })
      setSuccessModalOpen(false)
      setSuccessTransaction(null)
      setSuccessReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = err?.message || "Échec du marquage de la transaction comme succès"
      setSuccessError(errorMessage)
      toast({ title: "Échec du marquage comme succès", description: errorMessage, variant: "destructive" })
    } finally {
      setSuccessLoading(false)
    }
  }

  // Open/submit failed
  const openFailedModal = (tx: any) => {
    setFailedTransaction(tx)
    setFailedReason("")
    setFailedError("")
    setFailedModalOpen(true)
  }

  const handleFailedSubmit = async () => {
    if (!failedTransaction) return
    if (!failedReason.trim()) {
      setFailedError("La raison est requise")
      return
    }
    setFailedLoading(true)
    setFailedError("")
    try {
      const endpoint = `${baseUrl}/api/payments/transactions/${failedTransaction.uid}/mark-failed/`
      await apiWithRetry(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failedReason.trim() }),
      })
      toast({
        title: "Échec en file d'attente",
        description: "Mise à jour d'échec envoyée avec succès.",
      })
      setFailedModalOpen(false)
      setFailedTransaction(null)
      setFailedReason("")
      setCurrentPage(1)
      router.refresh()
      await fetchTransactions()
    } catch (err: any) {
      const errorMessage = err?.message || "Échec du marquage de la transaction comme échec"
      setFailedError(errorMessage)
      toast({ title: "Échec du marquage comme échec", description: errorMessage, variant: "destructive" })
    } finally {
      setFailedLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Transactions
          </h1>
          <p className="text-muted-foreground">
            Gérer et surveiller toutes les transactions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount.toLocaleString()} transactions
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des transactions..."
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
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
                <SelectItem value="transfer">Transfert</SelectItem>
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

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Liste des transactions
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
                onRetry={fetchTransactions}
                variant="full"
              />
            </div>
          ) : (
            <div className="space-y-0">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucune transaction trouvée</p>
                  <p className="text-sm">Aucune transaction ne correspond à vos critères de recherche.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handleSort("amount")}
                        >
                          <div className="flex items-center gap-2">
                            Montant
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Destinataire</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2">
                            Statut
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Créé par</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handleSort("created_at")}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.uid} className="hover:bg-accent/20">
                          <TableCell>
                            <div className="font-mono text-sm">
                              {transaction.reference || transaction.uid || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type || transaction.trans_type)}
                              <span className="text-sm font-medium">
                                {transaction.type || transaction.trans_type || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {parseFloat(transaction.amount || 0).toLocaleString()} FCFA
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.display_recipient_name || transaction.recipient_phone || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.created_by_name || transaction.created_by_email || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openRetryModal(transaction)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    Relancer
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openCancelModal(transaction)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Annuler la transaction
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openSuccessModal(transaction)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Marquer comme succès
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openFailedModal(transaction)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    Marquer comme échec
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/transactions/${transaction.uid}/edit`}>
                                    <div className="flex items-center gap-2">
                                      <Pencil className="w-4 h-4" />
                                      Modifier
                                    </div>
                                  </Link>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem onClick={() => handleOpenDetail(transaction.uid)}>
                                  <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Voir les détails
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteUid(transaction.uid)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <Trash className="w-4 h-4" />
                                    Supprimer
                                  </div>
                                </DropdownMenuItem> */}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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

      {/* Transaction Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
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
          ) : selectedTransaction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">ID Transaction</label>
                  <span className="font-mono text-sm">{selectedTransaction.uid || selectedTransaction.reference || "N/A"}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Montant</label>
                  <span className="text-lg font-semibold">{parseFloat(selectedTransaction.amount || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <Badge variant="outline" className="capitalize">
                    {selectedTransaction.type || selectedTransaction.trans_type || "N/A"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Utilisateur</label>
                <span className="text-sm">{selectedTransaction.user_email || selectedTransaction.created_by_email || selectedTransaction.display_recipient_name || "N/A"}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <span className="text-sm">{selectedTransaction.description || selectedTransaction.confirmation_message || "N/A"}</span>
              </div>

              {selectedTransaction.recipient_phone && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Téléphone du destinataire</label>
                  <span className="text-sm">{selectedTransaction.recipient_phone}</span>
                </div>
              )}

              {selectedTransaction.external_transaction_id && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">ID Transaction Externe</label>
                  <span className="text-sm font-mono">{selectedTransaction.external_transaction_id}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <span className="text-sm">{selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : "N/A"}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
                  <span className="text-sm">{selectedTransaction.updated_at ? new Date(selectedTransaction.updated_at).toLocaleString() : (selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : "N/A")}</span>
                </div>
              </div>

              {selectedTransaction.error_message && (
                <div className="space-y-2 pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground text-red-600">Message d'erreur</label>
                  <span className="text-sm text-red-600">{selectedTransaction.error_message}</span>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={handleCloseDetail} className="w-full">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la transaction</DialogTitle>
            <DialogDescription>Mettre à jour les détails de la transaction</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <label>Statut
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="completed">Terminé</option>
                  <option value="success">Succès</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échoué</option>
                  <option value="sent_to_user">Envoyé à l'utilisateur</option>
                </select>
              </label>
              <label>ID Transaction Externe
                <Input name="external_transaction_id" value={editForm.external_transaction_id} onChange={handleEditChange} />
              </label>
              <label>Solde avant
                <Input name="balance_before" value={editForm.balance_before} onChange={handleEditChange} />
              </label>
              <label>Solde après
                <Input name="balance_after" value={editForm.balance_after} onChange={handleEditChange} />
              </label>
              <label>Frais
                <Input name="fees" value={editForm.fees} onChange={handleEditChange} />
              </label>
              <label>Message de confirmation
                <Input name="confirmation_message" value={editForm.confirmation_message} onChange={handleEditChange} />
              </label>
              <label>SMS brut
                <Input name="raw_sms" value={editForm.raw_sms} onChange={handleEditChange} />
              </label>
              <label>Terminé à
                <Input name="completed_at" value={editForm.completed_at} onChange={handleEditChange} type="datetime-local" />
              </label>
              <label>Message d'erreur
                <Input name="error_message" value={editForm.error_message} onChange={handleEditChange} />
              </label>
            </div>
            {editError && (
              <ErrorDisplay
                error={editError}
                variant="inline"
                showRetry={false}
                className="mb-4"
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={editLoading}>{editLoading ? "Enregistrement..." : "Examiner et confirmer"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer les modifications</DialogTitle>
            <DialogDescription>
              Veuillez examiner les détails ci-dessous avant d'enregistrer les modifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">UID:</span><span className="font-medium">{editTransaction?.uid}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Statut:</span><span className="font-medium">{pendingEditPayload?.status || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ID Transaction Externe:</span><span className="font-medium">{pendingEditPayload?.external_transaction_id || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frais:</span><span className="font-medium">{pendingEditPayload?.fees || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Terminé à:</span><span className="font-medium">{pendingEditPayload?.completed_at || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Message d'erreur:</span><span className="font-medium">{pendingEditPayload?.error_message || "-"}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditConfirm(false)} disabled={editLoading}>
              Annuler
            </Button>
            <Button onClick={confirmEditAndSend} disabled={editLoading}>
              {editLoading ? "Enregistrement..." : "Soumettre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retry Transaction Modal */}
      <Dialog open={retryModalOpen} onOpenChange={setRetryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relancer la transaction</DialogTitle>
            <DialogDescription>Fournir une raison pour relancer cette transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Raison
            </label>
            <Input
              placeholder="Tentative de relance après timeout"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
            {retryError && (
              <ErrorDisplay error={retryError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleRetrySubmit} disabled={retryLoading}>
              {retryLoading ? "Envoi..." : "Soumettre"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Transaction Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la transaction</DialogTitle>
            <DialogDescription>Fournir une raison pour annuler cette transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Raison
            </label>
            <Input
              placeholder="Tentative de relance après timeout"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            {cancelError && (
              <ErrorDisplay error={cancelError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCancelSubmit} disabled={cancelLoading}>
              {cancelLoading ? "Envoi..." : "Soumettre"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer la transaction comme succès</DialogTitle>
            <DialogDescription>Fournir une raison pour marquer cette transaction comme succès.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Raison
            </label>
            <Input
              placeholder="Tentative de relance après timeout"
              value={successReason}
              onChange={(e) => setSuccessReason(e.target.value)}
            />
            {successError && (
              <ErrorDisplay error={successError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessSubmit} disabled={successLoading}>
              {successLoading ? "Envoi..." : "Soumettre"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Failed Modal */}
      <Dialog open={failedModalOpen} onOpenChange={setFailedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer la transaction comme échec</DialogTitle>
            <DialogDescription>Fournir une raison pour marquer cette transaction comme échec.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Raison
            </label>
            <Input
              placeholder="Tentative de relance après timeout"
              value={failedReason}
              onChange={(e) => setFailedReason(e.target.value)}
            />
            {failedError && (
              <ErrorDisplay error={failedError} variant="inline" showRetry={false} className="mb-2" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleFailedSubmit} disabled={failedLoading}>
              {failedLoading ? "Envoi..." : "Soumettre"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUid} onOpenChange={() => setDeleteUid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement la transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUid(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}