"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, DollarSign, Users, Clock, CheckCircle, XCircle, Loader2, Eye, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"


export default function TopupPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [currentPage, setCurrentPage] = useState(1)
	const [topups, setTopups] = useState<any[]>([])
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
	const [detailTopup, setDetailTopup] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")
	
	// Approve/Reject modal state
	const [actionModalOpen, setActionModalOpen] = useState(false);
	const [actionType, setActionType] = useState<"approve"|"reject"|null>(null);
	const [actionTopup, setActionTopup] = useState<any|null>(null);
	const [adminNotes, setAdminNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState(false);
	const [disabledTopups, setDisabledTopups] = useState<{[uid:string]:"approved"|"rejected"|undefined}>({});
	const [proofImageModalOpen, setProofImageModalOpen] = useState(false);
	const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string>("");

	// Calculate summary stats
	const pendingCount = topups.filter(t => (t.status_display || t.status) === 'pending' || (t.status_display || t.status) === 'en attente').length;
	const approvedCount = topups.filter(t => (t.status_display || t.status) === 'approved' || (t.status_display || t.status) === 'approuvé' || (t.status_display || t.status) === 'approuvée').length;
	const rejectedCount = topups.filter(t => (t.status_display || t.status) === 'rejected' || (t.status_display || t.status) === 'rejeté' || (t.status_display || t.status) === 'rejetée').length;
	const totalAmount = topups.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

	// Fetch topups from API
	const fetchTopups = async () => {
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
			const orderingParam = sortField
				? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
				: ""
			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/recharge-requests/?${params.toString()}${orderingParam}`
			const data = await apiFetch(endpoint)
			setTopups(data.results || [])
			setTotalCount(data.count || 0)
			setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
			toast({ title: t("topup.success"), description: t("topup.loadedSuccessfully") })
		} catch (err: any) {
			const errorMessage = extractErrorMessages(err)
			setError(errorMessage)
			setTopups([])
			setTotalCount(0)
			setTotalPages(1)
			toast({ title: t("topup.failedToLoad"), description: errorMessage, variant: "destructive" })
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTopups()
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, t, toast, apiFetch])

	const handleRefresh = async () => {
		await fetchTopups()
	}

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "amount" | "created_at" | "status") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

	// Fetch topup details
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailTopup(null)
		try {
			// For demo, just find in topups
			const found = topups.find((t) => t.uid === uid)
			setDetailTopup(found)
			toast({ title: t("topup.detailLoaded"), description: t("topup.detailLoadedSuccessfully") })
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("topup.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	const handleCloseDetail = () => {
		setDetailModalOpen(false)
		setDetailTopup(null)
		setDetailError("")
	}

	const getStatusBadge = (statusDisplay: string) => {
		const statusMap: { [key: string]: { color: string; icon: any } } = {
			'pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
			'en attente': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
			'approved': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'approuvé': { color: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'approuvée': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
			'rejected': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'rejeté': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'rejetée': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
			'completed': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'terminé': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'terminée': { color: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
			'expired': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'expiré': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'expirée': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: XCircle },
			'proof_submitted': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: AlertTriangle },
			'preuve soumise': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: AlertTriangle }
		};
		
		const statusInfo = statusMap[statusDisplay.toLowerCase()] || statusMap['pending'];
		const IconComponent = statusInfo.icon;
		
		return (
			<Badge className={statusInfo.color}>
				<div className="flex items-center space-x-1">
					<IconComponent className="h-3 w-3" />
					<span className="capitalize">{statusDisplay}</span>
				</div>
			</Badge>
		);
	};

	if (loading) {
		return (
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
						<div className="h-4 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
					</div>
					<div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
				</div>
				
				<Card className="animate-pulse">
					<CardHeader>
						<div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
							<div className="h-64 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
						{t("topup.title") || "Demandes de recharge"}
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground">
						Gérer et examiner les demandes de recharge des utilisateurs
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 sm:gap-3">
					<div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
						<DollarSign className="h-4 w-4 text-primary shrink-0" />
						<span className="text-sm font-medium text-foreground">
							{totalCount} demandes
						</span>
					</div>
					<Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="touch-manipulation">
						<RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
						<span className="hidden sm:inline">Actualiser</span>
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			{/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">Montant total</p>
								<p className="text-2xl font-bold text-foreground">
									{totalAmount.toLocaleString()} XOF
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
								<DollarSign className="h-6 w-6 text-primary" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">En attente</p>
								<p className="text-2xl font-bold text-foreground">
									{pendingCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
								<Clock className="h-6 w-6 text-yellow-500" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">Approuvées</p>
								<p className="text-2xl font-bold text-foreground">
									{approvedCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
								<CheckCircle className="h-6 w-6 text-green-500" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">Rejetées</p>
								<p className="text-2xl font-bold text-foreground">
									{rejectedCount}
								</p>
							</div>
							<div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
								<XCircle className="h-6 w-6 text-red-500" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div> */}

			{error && (
				<Card>
					<CardContent className="p-6">
						<ErrorDisplay 
							error={error}
							onRetry={handleRefresh}
						/>
					</CardContent>
				</Card>
			)}

			{/* Main Content */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						Demandes de recharge
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Search & Filter */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 items-center">
						<div className="relative flex-1 w-full sm:w-auto">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder={t("topup.search") || "Rechercher"}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 h-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-48 h-10">
								<SelectValue placeholder={t("topup.allStatuses") || "Tous les statuts"} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("topup.allStatuses") || "Tous les statuts"}</SelectItem>
								<SelectItem value="pending">{t("topup.pending") || "En attente"}</SelectItem>
								<SelectItem value="approved">{t("topup.approved") || "Approuvé"}</SelectItem>
								<SelectItem value="rejected">{t("topup.rejected") || "Rejeté"}</SelectItem>
								<SelectItem value="expired">{t("topup.expired") || "Expiré"}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Table */}
					<div className="overflow-x-auto scrollbar-hide">
						<div className="min-w-[800px]">
							<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="font-semibold min-w-[100px]">{t("topup.uid") || "UID"}</TableHead>
									<TableHead className="min-w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold hover:bg-transparent">
											{t("topup.amount") || "Montant"}
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
									<TableHead className="min-w-[140px]">{t("topup.formattedAmount") || "Montant formaté"}</TableHead>
									<TableHead className="min-w-[100px]">
										<Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold hover:bg-transparent">
											{t("topup.status") || "Statut"}
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
									<TableHead className="min-w-[120px]">{t("topup.userName") || "Nom d'utilisateur"}</TableHead>
									<TableHead className="min-w-[150px]">{t("topup.userEmail") || "Email utilisateur"}</TableHead>
									<TableHead className="min-w-[120px]">{t("topup.reference") || "Référence"}</TableHead>
									<TableHead>
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold hover:bg-transparent">
											{t("topup.createdAt") || "Créé le"}
											<ArrowUpDown className="ml-2 h-4 w-4" />
										</Button>
									</TableHead>
									<TableHead>{t("topup.details") || "Détails"}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{topups.map((topup) => (
									<TableRow key={topup.uid} className="hover:bg-accent/50">
										<TableCell className="font-mono text-sm">{topup.uid}</TableCell>
										<TableCell className="font-semibold">{topup.amount} XOF</TableCell>
										<TableCell>{topup.formatted_amount}</TableCell>
										<TableCell>
											{getStatusBadge(topup.status_display || topup.status)}
										</TableCell>
										<TableCell className="font-medium">{topup.user_name}</TableCell>
										<TableCell className="text-muted-foreground">{topup.user_email}</TableCell>
										<TableCell className="font-mono text-sm">{topup.reference}</TableCell>
										<TableCell className="text-muted-foreground">
											{topup.created_at ? new Date(topup.created_at).toLocaleDateString() : "-"}
										</TableCell>
										<TableCell>
											<div className="flex gap-2 items-center">
												<Button 
													size="sm" 
													variant="outline" 
													onClick={() => handleOpenDetail(topup.uid)}
													className="flex items-center gap-1"
												>
													<Eye className="h-3 w-3" />
													<span>{t("topup.details") || "Détails"}</span>
												</Button>
												{/* Approve Button */}
												<Button
													size="sm"
													variant="default"
													disabled={
														!!disabledTopups[topup.uid]
														|| ((topup.status_display || topup.status)?.toLowerCase() !== "pending" && (topup.status_display || topup.status)?.toLowerCase() !== "en attente" && (topup.status_display || topup.status)?.toLowerCase() !== "proof_submitted" && (topup.status_display || topup.status)?.toLowerCase() !== "preuve soumise")
														|| !!topup.is_expired
														// || (topup.expires_at && new Date(topup.expires_at) < new Date())
													}
													onClick={() => {
														setActionType("approve");
														setActionTopup(topup);
														setAdminNotes("");
														setActionModalOpen(true);
													}}
												>
													{disabledTopups[topup.uid] === "approved" ? t("topup.approved") || "Approuvé" : t("topup.approve") || "Approuver"}
												</Button>
												{/* Reject Button */}
												<Button
													size="sm"
													variant="destructive"
													disabled={
														!!disabledTopups[topup.uid]
														|| ((topup.status_display || topup.status)?.toLowerCase() !== "pending" && (topup.status_display || topup.status)?.toLowerCase() !== "en attente" && (topup.status_display || topup.status)?.toLowerCase() !== "proof_submitted" && (topup.status_display || topup.status)?.toLowerCase() !== "preuve soumise")
														|| !!topup.is_expired
														// || (topup.expires_at && new Date(topup.expires_at) < new Date())
													}
													onClick={() => {
														setActionType("reject");
														setActionTopup(topup);
														setAdminNotes("");
														setRejectionReason("");
														setActionModalOpen(true);
													}}
												>
													{disabledTopups[topup.uid] === "rejected" ? t("topup.rejected") || "Rejeté" : t("topup.reject") || "Rejeter"}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
							</Table>
						</div>
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between mt-6">
						<div className="text-sm text-muted-foreground">
							{`${t("topup.showingResults") || "Affichage"}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className="flex items-center gap-1"
							>
								<ChevronLeft className="h-4 w-4" />
								<span>{t("common.previous") || "Précédent"}</span>
							</Button>
							<div className="text-sm text-muted-foreground px-4">
								{`${t("topup.pageOf") || "Page"}: ${currentPage}/${totalPages}`}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
								className="flex items-center gap-1"
							>
								<span>{t("common.next") || "Suivant"}</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Topup Details Modal */}
			<Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Eye className="h-5 w-5 text-primary" />
							<span>{t("topup.details") || "Détails de la recharge"}</span>
						</DialogTitle>
					</DialogHeader>
					{detailLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : detailError ? (
						<ErrorDisplay
							error={detailError}
							variant="inline"
							showRetry={false}
							className="mb-4"
						/>
					) : detailTopup ? (
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<b>{t("topup.uid") || "UID"}:</b> {detailTopup.uid}
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5"
									onClick={() => {
										navigator.clipboard.writeText(detailTopup.uid)
										toast({ title: t("topup.copiedUid") || "UID copié!" })
									}}
									aria-label={t("topup.copyUid") || "Copier UID"}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							<div><b>{t("topup.formattedAmount") || "Montant formaté"}:</b> {detailTopup.formatted_amount}</div>
							<div><b>{t("topup.status") || "Statut"}:</b> {detailTopup.status_display || detailTopup.status}</div>
							<div><b>{t("topup.userName") || "Nom d'utilisateur"}:</b> {detailTopup.user_name}</div>
							<div><b>{t("topup.userEmail") || "Email utilisateur"}:</b> {detailTopup.user_email}</div>
							<div><b>{t("topup.reference") || "Référence"}:</b> {detailTopup.reference}</div>
							<div><b>{t("topup.createdAt") || "Créé le"}:</b> {detailTopup.created_at ? detailTopup.created_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.expiresAt") || "Expire le"}:</b> {detailTopup.expires_at ? detailTopup.expires_at.split("T")[0] : "-"}</div>
							<div className="flex items-center gap-2">
								<b>{t("topup.proofImage") || "Image de preuve"}:</b>
								{detailTopup.proof_image ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setProofImageUrl(detailTopup.proof_image);
											setProofImageModalOpen(true);
										}}
										className="flex items-center gap-1"
									>
										<Eye className="h-3 w-3" />
										<span>{t("topup.viewProof") || "Voir l'image"}</span>
									</Button>
								) : (
									<span className="text-muted-foreground">{t("topup.noProofImage") || "Aucune image"}</span>
								)}
							</div>
							<div><b>{t("topup.proofDescription") || "Description de la preuve"}:</b> {detailTopup.proof_description}</div>
							<div><b>{t("topup.isExpired") || "Expiré"}:</b> {detailTopup.is_expired ? "Oui" : "Non"}</div>
							<div><b>{t("topup.timeRemaining") || "Temps restant"}:</b> {detailTopup.time_remaining ? `${detailTopup.time_remaining} secondes` : "-"}</div>
							<div><b>{t("topup.reviewedBy") || "Examiné par"}:</b> {detailTopup.reviewed_by_name}</div>
							<div><b>{t("topup.reviewedAt") || "Examiné le"}:</b> {detailTopup.reviewed_at ? detailTopup.reviewed_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.processedAt") || "Traité le"}:</b> {detailTopup.processed_at ? detailTopup.processed_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.adminNotes") || "Notes d'administrateur"}:</b> {detailTopup.admin_notes}</div>
							<div><b>{t("topup.rejectionReason") || "Raison du rejet"}:</b> {detailTopup.rejection_reason}</div>
						</div>
					) : null}
					<DialogClose asChild>
						<Button className="mt-4 w-full">Fermer</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* Proof Image Modal */}
			<Dialog open={proofImageModalOpen} onOpenChange={setProofImageModalOpen}>
				<DialogContent className="flex flex-col items-center justify-center">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Eye className="h-5 w-5 text-primary" />
							<span>{t("topup.proofImage") || "Image de preuve"}</span>
						</DialogTitle>
					</DialogHeader>
					{proofImageUrl && (
						<img
							src={proofImageUrl}
							alt={t("topup.proofImageAlt") || "Preuve"}
							className="max-w-full max-h-[70vh] rounded border"
							style={{ objectFit: "contain" }}
						/>
					)}
					<DialogClose asChild>
						<Button className="mt-4 w-full">Fermer</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* Approve/Reject Modal */}
			<Dialog open={actionModalOpen} onOpenChange={(open) => {
				setActionModalOpen(open);
				if (!open) {
					setActionError("");
				}
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{actionType === "approve" ? (
								<CheckCircle className="h-5 w-5 text-green-600" />
							) : (
								<XCircle className="h-5 w-5 text-red-600" />
							)}
							<span>
								{actionType === "approve"
									? t("topup.approveTitle") || "Approuver la demande"
									: t("topup.rejectTitle") || "Rejeter la demande"}
							</span>
						</DialogTitle>
					</DialogHeader>
					{actionError && (
						<div className="mb-4">
							<ErrorDisplay error={actionError} variant="inline" showRetry={false} showDismiss={true} onDismiss={() => setActionError("")} />
						</div>
					)}
					{actionType === "approve" ? (
						<div className="space-y-4">
							<div>
								<Label htmlFor="adminNotes" className="text-sm font-medium">
									{t("topup.adminNotes") || "Notes d'administrateur"}
								</Label>
								<Input
									id="adminNotes"
									placeholder={t("topup.adminNotes") || "Notes d'administrateur"}
									value={adminNotes}
									onChange={e => setAdminNotes(e.target.value)}
								/>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<Label htmlFor="rejectionReason" className="text-sm font-medium">
									{t("topup.rejectionReason") || "Raison du rejet"}
								</Label>
								<Input
									id="rejectionReason"
									placeholder={t("topup.rejectionReason") || "Raison du rejet"}
									value={rejectionReason}
									onChange={e => setRejectionReason(e.target.value)}
								/>
							</div>
						</div>
					)}
					<DialogFooter className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setActionModalOpen(false)}
						>
							{t("common.cancel") || "Annuler"}
						</Button>
						<Button
							onClick={async () => {
								setPendingAction(true);
								setActionError("");
								try {
									const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/recharge-requests/${actionTopup.uid}/${actionType}/`;
									const payload =
										actionType === "approve"
											? { admin_notes: adminNotes }
											: { rejection_reason: rejectionReason };
									await apiFetch(endpoint, {
										method: "POST",
										body: JSON.stringify(payload),
										headers: { "Content-Type": "application/json" },
									});
									setDisabledTopups(prev => ({
										...prev,
										[actionTopup.uid]: actionType === "approve" ? "approved" : "rejected",
									}));
									setActionModalOpen(false);
									setAdminNotes("");
									setRejectionReason("");
									toast({
										title: t("topup.success"),
										description:
											actionType === "approve"
												? t("topup.approvedSuccessfully") || "Demande approuvée"
												: t("topup.rejectedSuccessfully") || "Demande rejetée",
									});
								} catch (err: any) {
									const errorMessage = extractErrorMessages(err);
									setActionError(errorMessage);
									console.error('Topup action error:', err);
									toast({
										title: t("topup.failed"),
										description: errorMessage,
										variant: "destructive",
									});
								} finally {
									setPendingAction(false);
								}
							}}
							disabled={
								pendingAction
								|| (actionType === "approve" && !adminNotes)
								|| (actionType === "reject" && !rejectionReason)
								|| !!actionTopup?.is_expired
								// || (actionTopup?.expires_at && new Date(actionTopup.expires_at) < new Date())
							}
							className={
								actionType === "approve" 
									? "bg-green-600 hover:bg-green-700 text-white" 
									: "bg-red-600 hover:bg-red-700 text-white"
							}
						>
							{pendingAction ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Traitement...
								</>
							) : (
								actionType === "approve"
									? t("topup.confirmApprove") || "Confirmer l'approbation"
									: t("topup.confirmReject") || "Confirmer le rejet"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
