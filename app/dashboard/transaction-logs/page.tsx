"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, FileText, Filter, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"

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

export default function TransactionLogsListPage() {
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [logs, setLogs] = useState<any[]>([])
  const [count, setCount] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleSearchSubmit = () => {
    setSearchTerm(searchInput.trim())
    setCurrentPage(1)
  }

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })
        if (searchTerm) params.append("search", searchTerm)
        if (sortField) params.append("ordering", `${sortDirection === "asc" ? "+" : "-"}${sortField}`)

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/transaction-logs/?${params.toString()}`
        const data = await apiFetch(endpoint)

        // API shape example from user: { count, next, previous, results: [] }
        setLogs(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
        setCount(typeof data?.count === "number" ? data.count : (Array.isArray(data?.results) ? data.results.length : 0))

        toast({
          title: t("transactionLogs.success") || "Succès",
          description: t("transactionLogs.loadedSuccessfully") || "Journaux de transaction chargés avec succès",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("transactionLogs.failedToLoad") || "Échec du chargement des journaux de transaction"
        setError(errorMessage)
        setLogs([])
        setCount(0)
        toast({
          title: t("transactionLogs.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("Transaction logs fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [apiFetch, currentPage, pageSize, searchTerm, sortField, sortDirection, t])

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("transactionLogs.list") || "Transaction Logs"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Surveiller l'activité des transactions et les journaux système
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {count} journaux
                  </span>
                </div>
              </div>
            </div>
          </div>
      </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                  placeholder="Rechercher dans les journaux de transaction..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            <Button
              onClick={handleSearchSubmit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
                Rechercher
            </Button>
          </div>
          </CardContent>
        </Card>

        {/* Transaction Logs Table */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <span>Journaux de transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 dark:text-gray-300">Chargement des journaux de transaction...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <ErrorDisplay error={error} onRetry={() => {/* retry function */}} />
        </div>
            ) : (
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                      <TableHead className="font-semibold">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("created_at")}
                          className="h-auto p-0 font-semibold hover:bg-transparent"
                        >
                          Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                      <TableHead className="font-semibold">ID de transaction</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Utilisateur</TableHead>
                      <TableHead className="font-semibold">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id || log.uid} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <TableCell>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {log.created_at 
                              ? new Date(log.created_at).toLocaleString()
                              : 'Inconnu'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.transaction_id || log.id || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              log.transaction_type === 'deposit'
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : log.transaction_type === 'withdrawal'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            }
                          >
                            {log.transaction_type || 'Inconnu'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              log.status === 'success' || log.status === 'completed'
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : log.status === 'failed' || log.status === 'error'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {log.status === 'success' || log.status === 'completed' ? (
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
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {log.amount ? parseFloat(log.amount).toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {log.user_name || log.user_id || 'Inconnu'}
                          </div>
                        </TableCell>
                      <TableCell>
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                              {log.message || log.description || 'Aucun détail'}
                            </div>
                            {log.error_message && (
                              <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                                Erreur : {log.error_message}
                              </div>
                            )}
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, count)} sur {count} résultats
              </div>
            <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-blue-600 text-white" : ""}
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
        {!loading && !error && logs.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg mt-6">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucun journal de transaction trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? `Aucun journal de transaction ne correspond à "${searchTerm}"` : "Aucun journal de transaction n'a encore été enregistré."}
              </p>
      </CardContent>
    </Card>
        )}

      </div>
    </div>
  )
}
