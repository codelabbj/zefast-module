"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Users, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Calendar, 
  UserCheck, 
  DollarSign,
  Download,
  RefreshCw,
  Eye,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

export default function PartnerPage() {
	// Temporarily commented out
	return (
		<div className="space-y-8 p-8">
			<h1 className="text-3xl font-bold text-foreground tracking-tight">Partenaires</h1>
			<p className="text-muted-foreground">Cette page est temporairement désactivée.</p>
		</div>
	)
	
	/* Temporarily commented out - Original code below
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [currentPage, setCurrentPage] = useState(1)
	const [partners, setPartners] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const { t } = useLanguage()
	const itemsPerPage = 20
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailPartner, setDetailPartner] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")

	useEffect(() => {
		const fetchPartners = async () => {
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
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }
        if (sortField) {
          params.append("ordering", `${sortDirection === "asc" ? "" : "-"}${sortField}`)
        }
        
        const endpoint = `${baseUrl}/api/auth/admin/users/partners/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        // Handle the API response structure
        if (data.partners) {
          setPartners(data.partners)
          setTotalCount(data.pagination?.total_count || data.partners.length)
          setTotalPages(data.pagination?.total_pages || Math.ceil(data.partners.length / itemsPerPage))
        } else if (data.results) {
          // Fallback for different response structure
          setPartners(data.results)
          setTotalCount(data.count || 0)
          setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        } else {
          // Fallback for non-paginated response
          const partnersArray = Array.isArray(data) ? data : []
          setPartners(partnersArray)
          setTotalCount(partnersArray.length)
          setTotalPages(1)
        }
        
        toast({
          title: t("partners.success") || "Partenaires chargés",
          description: t("partners.loadedSuccessfully") || "Liste des partenaires chargée avec succès",
        })
			} catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("partners.failedToLoad") || "Échec du chargement des partenaires"
        setError(errorMessage)
        setPartners([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("partners.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Partners fetch error:', err)
			} finally {
        setLoading(false)
			}
		}

		fetchPartners()
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection])

  const filteredPartners = partners // Filtering handled by API

	const handleSort = (field: "display_name" | "email" | "created_at") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )
  }

	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailPartner(null)
		try {
      const endpoint = `${baseUrl}/api/auth/admin/users/partners/${uid}/`
      const data = await apiFetch(endpoint)
      setDetailPartner(data)
      setDetailLoading(false)
		} catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec du chargement des détails du partenaire"
      setDetailError(errorMessage)
			setDetailLoading(false)
		}
	}

  const handleRefresh = async () => {
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
        params.append("is_active", statusFilter === "active" ? "true" : "false")
      }
      if (sortField) {
        params.append("ordering", `${sortDirection === "asc" ? "" : "-"}${sortField}`)
      }
      
      const endpoint = `${baseUrl}/api/auth/admin/users/partners/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      if (data.partners) {
        setPartners(data.partners)
        setTotalCount(data.pagination?.total_count || data.partners.length)
        setTotalPages(data.pagination?.total_pages || Math.ceil(data.partners.length / itemsPerPage))
      } else if (data.results) {
        setPartners(data.results)
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } else {
        const partnersArray = Array.isArray(data) ? data : []
        setPartners(partnersArray)
        setTotalCount(partnersArray.length)
        setTotalPages(1)
      }
      
      toast({
        title: t("partners.success") || "Partenaires actualisés",
        description: t("partners.loadedSuccessfully") || "Liste des partenaires actualisée avec succès",
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("partners.failedToLoad") || "Échec du chargement des partenaires"
      setError(errorMessage)
      toast({
        title: t("partners.failedToLoad") || "Échec du chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailPartner(null)
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

	return (
    <div className="space-y-8">
      {/* Header */}
					<div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Partenaires
							</h1>
          <p className="text-muted-foreground">
            Gérer les partenaires et leurs commissions
											</p>
						</div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount.toLocaleString()} partenaires
									</span>
								</div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {partners.reduce((sum, p) => sum + (parseFloat(p.total_commissions_received) || 0), 0).toLocaleString()} XOF
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
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift">
						<CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Partenaires</p>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+2 ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
								</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Partenaires Actifs</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.filter(p => p.is_active).length}
                </p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    {totalCount > 0 ? Math.round((partners.filter(p => p.is_active).length / totalCount) * 100) : 0}% du total
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-500" />
								</div>
							</div>
						</CardContent>
					</Card>

        <Card className="hover-lift">
						<CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Commissions Totales</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.reduce((sum, p) => sum + (parseFloat(p.total_commissions_received) || 0), 0).toLocaleString()} XOF
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
								</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.reduce((sum, p) => sum + (p.total_transactions || 0), 0)}
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div> */}

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
														<SelectItem value="active">Actif</SelectItem>
														<SelectItem value="inactive">Inactif</SelectItem>
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

				{/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des partenaires
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des partenaires...</span>
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
											<TableHead className="font-semibold">Partenaire</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
											<TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Commissions</TableHead>
                    <TableHead className="font-semibold">Transactions</TableHead>
                    <TableHead className="font-semibold">Créé le</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
                  {filteredPartners.map((partner, index) => (
                    <TableRow key={partner.uid || partner.id || index} className="hover:bg-accent/50">
												<TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {(partner.display_name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'U').charAt(0).toUpperCase()}
                            </span>
														</div>
														<div>
                            <div className="font-medium text-foreground">
                              {partner.display_name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'N/A'}
															</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {partner.uid || index}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {partner.email || partner.phone || 'N/A'}
														</span>
													</div>
												</TableCell>
											<TableCell>
                        {getStatusBadge(partner.is_active !== undefined ? partner.is_active : partner.is_partner)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-foreground">
                            {(parseFloat(partner.total_commissions_received) || 0).toLocaleString()} XOF
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Solde: {(partner.account_balance || 0).toLocaleString()} XOF
                          </div>
														</div>
												</TableCell>
												<TableCell>
                        <div className="text-sm font-medium text-foreground">
                          {partner.total_transactions || 0}
													</div>
												</TableCell>
												<TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {partner.created_at ? new Date(partner.created_at).toLocaleDateString() : 'N/A'}
														</span>
													</div>
											</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
															{/* <Button 
                            variant="ghost" 
																size="sm"
                            onClick={() => handleOpenDetail(partner.uid)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/dashboard/partner/details/${partner.uid}`}>
                            <Button variant="ghost" size="sm">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </Link> */}
                          <Link href={`/dashboard/partner/commission/${partner.uid}`}>
                            <Button variant="ghost" size="sm">
                              Comission stats
                              <DollarSign className="h-4 w-4" />
															</Button>
														</Link>
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

      {/* Partner Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
					<DialogContent className="max-w-2xl">
					<DialogHeader>
            <DialogTitle>Détails du partenaire</DialogTitle>
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
					) : detailPartner ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">UID</label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{detailPartner.uid || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(detailPartner.uid || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  {getStatusBadge(detailPartner.is_active)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <span className="text-sm">{detailPartner.display_name || `${detailPartner.first_name || ''} ${detailPartner.last_name || ''}`.trim() || 'N/A'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <span className="text-sm">{detailPartner.email || detailPartner.phone || 'N/A'}</span>
                </div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Commissions Reçues</label>
                  <span className="text-lg font-semibold">{(parseFloat(detailPartner.total_commissions_received) || 0).toLocaleString()} XOF</span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Solde du Compte</label>
                  <span className="text-lg font-semibold">{(detailPartner.account_balance || 0).toLocaleString()} XOF</span>
									</div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Transactions</label>
                  <span className="text-sm">{detailPartner.total_transactions || 0}</span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Transactions Complétées</label>
                  <span className="text-sm">{detailPartner.completed_transactions || 0}</span>
									</div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de Création</label>
                  <span className="text-sm">
                    {detailPartner.created_at ? new Date(detailPartner.created_at).toLocaleString() : 'N/A'}
                  </span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dernière Connexion</label>
                  <span className="text-sm">
                    {detailPartner.last_login_at ? new Date(detailPartner.last_login_at).toLocaleString() : 'Jamais'}
                  </span>
									</div>
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
	
	/* Temporarily commented out - Original code below
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [currentPage, setCurrentPage] = useState(1)
	const [partners, setPartners] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const { t } = useLanguage()
	const itemsPerPage = 20
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailPartner, setDetailPartner] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")

	useEffect(() => {
		const fetchPartners = async () => {
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
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }
        if (sortField) {
          params.append("ordering", `${sortDirection === "asc" ? "" : "-"}${sortField}`)
        }
        
        const endpoint = `${baseUrl}/api/auth/admin/users/partners/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        // Handle the API response structure
        if (data.partners) {
          setPartners(data.partners)
          setTotalCount(data.pagination?.total_count || data.partners.length)
          setTotalPages(data.pagination?.total_pages || Math.ceil(data.partners.length / itemsPerPage))
        } else if (data.results) {
          // Fallback for different response structure
          setPartners(data.results)
          setTotalCount(data.count || 0)
          setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        } else {
          // Fallback for non-paginated response
          const partnersArray = Array.isArray(data) ? data : []
          setPartners(partnersArray)
          setTotalCount(partnersArray.length)
          setTotalPages(1)
        }
        
        toast({
          title: t("partners.success") || "Partenaires chargés",
          description: t("partners.loadedSuccessfully") || "Liste des partenaires chargée avec succès",
        })
			} catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("partners.failedToLoad") || "Échec du chargement des partenaires"
        setError(errorMessage)
        setPartners([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("partners.failedToLoad") || "Échec du chargement",
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Partners fetch error:', err)
			} finally {
        setLoading(false)
			}
		}

		fetchPartners()
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection])

  const filteredPartners = partners // Filtering handled by API

	const handleSort = (field: "display_name" | "email" | "created_at") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )
  }

	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailPartner(null)
		try {
      const endpoint = `${baseUrl}/api/auth/admin/users/partners/${uid}/`
      const data = await apiFetch(endpoint)
      setDetailPartner(data)
      setDetailLoading(false)
		} catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec du chargement des détails du partenaire"
      setDetailError(errorMessage)
			setDetailLoading(false)
		}
	}

  const handleRefresh = async () => {
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
        params.append("is_active", statusFilter === "active" ? "true" : "false")
      }
      if (sortField) {
        params.append("ordering", `${sortDirection === "asc" ? "" : "-"}${sortField}`)
      }
      
      const endpoint = `${baseUrl}/api/auth/admin/users/partners/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      if (data.partners) {
        setPartners(data.partners)
        setTotalCount(data.pagination?.total_count || data.partners.length)
        setTotalPages(data.pagination?.total_pages || Math.ceil(data.partners.length / itemsPerPage))
      } else if (data.results) {
        setPartners(data.results)
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } else {
        const partnersArray = Array.isArray(data) ? data : []
        setPartners(partnersArray)
        setTotalCount(partnersArray.length)
        setTotalPages(1)
      }
      
      toast({
        title: t("partners.success") || "Partenaires actualisés",
        description: t("partners.loadedSuccessfully") || "Liste des partenaires actualisée avec succès",
      })
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("partners.failedToLoad") || "Échec du chargement des partenaires"
      setError(errorMessage)
      toast({
        title: t("partners.failedToLoad") || "Échec du chargement",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailPartner(null)
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

	return (
    <div className="space-y-8">
      {/* Header */}
					<div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Partenaires
							</h1>
          <p className="text-muted-foreground">
            Gérer les partenaires et leurs commissions
											</p>
						</div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount.toLocaleString()} partenaires
									</span>
								</div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {partners.reduce((sum, p) => sum + (parseFloat(p.total_commissions_received) || 0), 0).toLocaleString()} XOF
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
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift">
						<CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Partenaires</p>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+2 ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
								</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Partenaires Actifs</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.filter(p => p.is_active).length}
                </p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    {totalCount > 0 ? Math.round((partners.filter(p => p.is_active).length / totalCount) * 100) : 0}% du total
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-500" />
								</div>
							</div>
						</CardContent>
					</Card>

        <Card className="hover-lift">
						<CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Commissions Totales</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.reduce((sum, p) => sum + (parseFloat(p.total_commissions_received) || 0), 0).toLocaleString()} XOF
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
								</div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">
                  {partners.reduce((sum, p) => sum + (p.total_transactions || 0), 0)}
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8% ce mois</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div> */}

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
														<SelectItem value="active">Actif</SelectItem>
														<SelectItem value="inactive">Inactif</SelectItem>
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

				{/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des partenaires
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des partenaires...</span>
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
											<TableHead className="font-semibold">Partenaire</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
											<TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Commissions</TableHead>
                    <TableHead className="font-semibold">Transactions</TableHead>
                    <TableHead className="font-semibold">Créé le</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
                  {filteredPartners.map((partner, index) => (
                    <TableRow key={partner.uid || partner.id || index} className="hover:bg-accent/50">
												<TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {(partner.display_name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'U').charAt(0).toUpperCase()}
                            </span>
														</div>
														<div>
                            <div className="font-medium text-foreground">
                              {partner.display_name || `${partner.first_name || ''} ${partner.last_name || ''}`.trim() || 'N/A'}
															</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {partner.uid || index}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {partner.email || partner.phone || 'N/A'}
														</span>
													</div>
												</TableCell>
											<TableCell>
                        {getStatusBadge(partner.is_active !== undefined ? partner.is_active : partner.is_partner)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-foreground">
                            {(parseFloat(partner.total_commissions_received) || 0).toLocaleString()} XOF
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Solde: {(partner.account_balance || 0).toLocaleString()} XOF
                          </div>
														</div>
												</TableCell>
												<TableCell>
                        <div className="text-sm font-medium text-foreground">
                          {partner.total_transactions || 0}
													</div>
												</TableCell>
												<TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {partner.created_at ? new Date(partner.created_at).toLocaleDateString() : 'N/A'}
														</span>
													</div>
											</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
															{/* <Button 
                            variant="ghost" 
																size="sm"
                            onClick={() => handleOpenDetail(partner.uid)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={`/dashboard/partner/details/${partner.uid}`}>
                            <Button variant="ghost" size="sm">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </Link> */}
                          <Link href={`/dashboard/partner/commission/${partner.uid}`}>
                            <Button variant="ghost" size="sm">
                              Comission stats
                              <DollarSign className="h-4 w-4" />
															</Button>
														</Link>
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

      {/* Partner Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
					<DialogContent className="max-w-2xl">
					<DialogHeader>
            <DialogTitle>Détails du partenaire</DialogTitle>
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
					) : detailPartner ? (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">UID</label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{detailPartner.uid || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(detailPartner.uid || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  {getStatusBadge(detailPartner.is_active)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <span className="text-sm">{detailPartner.display_name || `${detailPartner.first_name || ''} ${detailPartner.last_name || ''}`.trim() || 'N/A'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <span className="text-sm">{detailPartner.email || detailPartner.phone || 'N/A'}</span>
                </div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Commissions Reçues</label>
                  <span className="text-lg font-semibold">{(parseFloat(detailPartner.total_commissions_received) || 0).toLocaleString()} XOF</span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Solde du Compte</label>
                  <span className="text-lg font-semibold">{(detailPartner.account_balance || 0).toLocaleString()} XOF</span>
									</div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Total Transactions</label>
                  <span className="text-sm">{detailPartner.total_transactions || 0}</span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Transactions Complétées</label>
                  <span className="text-sm">{detailPartner.completed_transactions || 0}</span>
									</div>
									</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de Création</label>
                  <span className="text-sm">
                    {detailPartner.created_at ? new Date(detailPartner.created_at).toLocaleString() : 'N/A'}
                  </span>
									</div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dernière Connexion</label>
                  <span className="text-sm">
                    {detailPartner.last_login_at ? new Date(detailPartner.last_login_at).toLocaleString() : 'Jamais'}
                  </span>
									</div>
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
	*/
}