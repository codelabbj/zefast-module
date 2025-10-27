"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
  MoreHorizontal, 
  Users, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  Copy,
  RefreshCw,
  Download,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useApi } from "@/lib/useApi"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { t } = useLanguage()
  const itemsPerPage = 10
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const [viewType, setViewType] = useState("all")
  const { toast } = useToast()
  const [activatingUid, setActivatingUid] = useState<string | null>(null)
  const [deactivatingUid, setDeactivatingUid] = useState<string | null>(null)
  const [selectedUids, setSelectedUids] = useState<string[]>([])
  const allSelected = users.length > 0 && users.every((u) => selectedUids.includes(u.uid))
  const someSelected = users.some((u) => selectedUids.includes(u.uid))
  const apiFetch = useApi();
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")
  
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verifyingPartner, setVerifyingPartner] = useState(false);
  const [verifyingUssd, setVerifyingUssd] = useState(false);

  const [confirmEmailToggle, setConfirmEmailToggle] = useState<null | boolean>(null);
  const [confirmPhoneToggle, setConfirmPhoneToggle] = useState<null | boolean>(null);
  const [confirmPartnerToggle, setConfirmPartnerToggle] = useState<null | boolean>(null);
  const [confirmUssdToggle, setConfirmUssdToggle] = useState<null | boolean>(null);

  const [confirmActionUser, setConfirmActionUser] = useState<any | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<"activate" | "deactivate" | null>(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || sortField) {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            page_size: itemsPerPage.toString(),
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("status", statusFilter);
          }
          const orderingParam = sortField
            ? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${(sortField === "display_name" ? "display_name" : sortField)}`
            : "";
          endpoint =
            viewType === "pending"
              ? `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/pending/?${params.toString()}${orderingParam}`
              : `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/?${params.toString()}${orderingParam}`;
        } else {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            page_size: itemsPerPage.toString(),
          });
          endpoint =
            viewType === "pending"
              ? `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/pending/?${params.toString()}`
              : `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/?${params.toString()}`;
        }
        console.log("User API endpoint:", endpoint);
        const data = await apiFetch(endpoint);
        console.log("API response data:", data);
        
        // Handle the actual API response structure
        const users = data.users || data.results || [];
        const totalCount = data.pagination?.total_count || data.count || 0;
        const totalPages = data.pagination?.total_pages || Math.ceil(totalCount / itemsPerPage);
        
        setUsers(users);
        setTotalCount(totalCount);
        setTotalPages(totalPages);
        toast({
          title: "Succès",
          description: "Utilisateurs chargés avec succès",
        });
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || "Échec du chargement des utilisateurs";
        setError(errorMessage);
        setUsers([]);
        toast({
          title: "Échec du chargement des utilisateurs",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Users fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchTerm, statusFilter, currentPage, sortField, sortDirection, viewType]);

  const filteredUsers = users // Filtering is now handled by the API
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers // Already paginated by API

  const handleSort = (field: "display_name" | "email" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants]}>{t(`users.${status}`)}</Badge>
  }

  // Activate user handler
  const handleActivate = async (user: any) => {
    if (!user.uid) return
    setActivatingUid(user.uid)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${user.uid}/activate/`, {
        method: "PATCH",
      })
      toast({ title: "Utilisateur activé", description: data.message || "Utilisateur activé avec succès" })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: "Échec de l'activation", description: extractErrorMessages(err) || "Impossible d'activer l'utilisateur", variant: "destructive" })
    } finally {
      setActivatingUid(null)
    }
  }

  // Deactivate user handler
  const handleDeactivate = async (user: any) => {
    if (!user.uid) return
    setDeactivatingUid(user.uid)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${user.uid}/deactivate/`, {
        method: "PATCH",
      })
      toast({ title: "Utilisateur désactivé", description: data.message || "Utilisateur désactivé avec succès" })
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, ...data.user } : u)))
    } catch (err: any) {
      toast({ title: "Échec de la désactivation", description: extractErrorMessages(err) || "Impossible de désactiver l'utilisateur", variant: "destructive" })
    } finally {
      setDeactivatingUid(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUids(Array.from(new Set([...selectedUids, ...users.map((u) => u.uid)])))
    } else {
      setSelectedUids(selectedUids.filter((uid) => !users.map((u) => u.uid).includes(uid)))
    }
  }

  const handleSelectRow = (uid: string, checked: boolean) => {
    setSelectedUids((prev) => checked ? [...prev, uid] : prev.filter((id) => id !== uid))
  }

  // Bulk action handler
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUids.length === 0) return
    setLoading(true)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/bulk-action/`, {
        method: "POST",
        body: JSON.stringify({ action, user_ids: selectedUids }),
      })
      toast({ title: "Action en lot réussie", description: data.message || "Action en lot terminée" })
      setUsers((prev) => prev.map((u) => selectedUids.includes(u.uid) ? { ...u, ...data.user } : u))
      setSelectedUids([])
      setCurrentPage(1)
    } catch (err: any) {
      toast({ title: "Échec de l'action en lot", description: extractErrorMessages(err) || "Impossible d'effectuer l'action en lot", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Fetch user details
  const handleOpenDetail = async (uid: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailError("")
    setDetailUser(null)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${uid}/`)
      setDetailUser(data)
      toast({ title: "Détails chargés", description: "Détails de l'utilisateur chargés avec succès" })
    } catch (err: any) {
      setDetailError(extractErrorMessages(err))
      toast({ title: "Échec du chargement des détails", description: extractErrorMessages(err), variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setDetailModalOpen(false)
    setDetailUser(null)
    setDetailError("")
  }

  // Add handler for verifying email
  const handleVerifyEmail = async () => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: true }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: true } : prev);
      toast({ title: "Email vérifié", description: "Email vérifié avec succès" });
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Add handler for verifying phone
  const handleVerifyPhone = async () => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: true }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: true } : prev);
      toast({ title: "Téléphone vérifié", description: "Téléphone vérifié avec succès" });
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Update handleVerifyEmail to handle both verify and unverify
  const handleToggleEmailVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingEmail(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_verified: verify }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, email_verified: verify } : prev);
      toast({ title: "Email vérifié", description: verify ? "Email vérifié avec succès" : "Email non vérifié avec succès" });
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Update handleVerifyPhone to handle both verify and unverify
  const handleTogglePhoneVerified = async (verify: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPhone(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_verified: verify }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, phone_verified: verify } : prev);
      toast({ title: "Téléphone vérifié", description: verify ? "Téléphone vérifié avec succès" : "Téléphone non vérifié avec succès" });
    } catch (err: any) {
      toast({ title: "Échec de la vérification", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Add handler for toggling is_partner
  const handleTogglePartner = async (isPartner: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingPartner(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_partner: isPartner }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, is_partner: isPartner } : prev);
      toast({ title: "Statut partenaire modifié", description: isPartner ? "Statut partenaire activé avec succès" : "Statut partenaire désactivé avec succès" });
    } catch (err: any) {
      toast({ title: "Échec de la modification du statut partenaire", description: extractErrorMessages(err), variant: "destructive" });
    } finally {
      setVerifyingPartner(false);
    }
  };

  // Add handler for toggling can_process_ussd_transaction
  const handleToggleUssdTransaction = async (canProcess: boolean) => {
    if (!detailUser?.uid) return;
    setVerifyingUssd(true);
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailUser.uid}/update/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ can_process_ussd_transaction: canProcess }),
      });
      setDetailUser((prev: any) => prev ? { ...prev, can_process_ussd_transaction: canProcess } : prev);
      toast({ 
        title: "Statut USSD modifié", 
        description: canProcess ? "Transaction USSD activée avec succès" : "Transaction USSD désactivée avec succès" 
      });
    } catch (err: any) {
      toast({ 
        title: "Échec de la modification du statut USSD", 
        description: extractErrorMessages(err), 
        variant: "destructive" 
      });
    } finally {
      setVerifyingUssd(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("users.title") || "Utilisateurs"}
          </h1>
          <p className="text-muted-foreground">
            Gérer et surveiller les comptes utilisateurs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalCount.toLocaleString()} utilisateurs
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
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
                placeholder="Rechercher des utilisateurs..."
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
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            {/* View Type */}
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger>
                <SelectValue placeholder="Type de vue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                <SelectItem value="pending">Utilisateurs en attente</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {someSelected && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction("activate")}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activer ({selectedUids.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction("deactivate")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Désactiver ({selectedUids.length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Liste des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des utilisateurs...</span>
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
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUids(users.map(u => u.uid));
                          } else {
                            setSelectedUids([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Utilisateur</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Vérification</TableHead>
                    <TableHead className="font-semibold">Créé le</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-accent/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUids.includes(user.uid)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUids([...selectedUids, user.uid]);
                            } else {
                              setSelectedUids(selectedUids.filter(id => id !== user.uid));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {user.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.display_name || 'Sans nom'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.uid}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? "default" : "secondary"}
                        >
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={user.email_verified ? "success" : "outline"}
                            className="text-xs"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email_verified ? 'Vérifié' : 'Non vérifié'}
                          </Badge>
                          <Badge 
                            variant={user.phone_verified ? "success" : "outline"}
                            className="text-xs"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone_verified ? 'Vérifié' : 'Non vérifié'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.created_at}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(user.uid)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (user.is_active) {
                                setConfirmActionUser(user);
                                setConfirmActionType("deactivate");
                              } else {
                                setConfirmActionUser(user);
                                setConfirmActionType("activate");
                              }
                            }}>
                              {user.is_active ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* User Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
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
          ) : detailUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">UID</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{detailUser.uid}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(detailUser.uid);
                        toast({ title: "UID copié!" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <Badge variant={detailUser.is_active ? "default" : "secondary"}>
                    {detailUser.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                  <span className="text-sm">{detailUser.display_name || `${detailUser.first_name || ""} ${detailUser.last_name || ""}`}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <span className="text-sm">{detailUser.email}</span>
                  </div>
                  {detailUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </Label>
                      <span className="text-sm">{detailUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email vérifié</Label>
                    <p className="text-xs text-muted-foreground">Marquer l'email comme vérifié</p>
                  </div>
                  <Switch
                    checked={detailUser.email_verified}
                    disabled={detailLoading || verifyingEmail}
                    onCheckedChange={() => setConfirmEmailToggle(!detailUser.email_verified)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Téléphone vérifié</Label>
                    <p className="text-xs text-muted-foreground">Marquer le téléphone comme vérifié</p>
                  </div>
                  <Switch
                    checked={detailUser.phone_verified}
                    disabled={detailLoading || verifyingPhone}
                    onCheckedChange={() => setConfirmPhoneToggle(!detailUser.phone_verified)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Partenaire</Label>
                    <p className="text-xs text-muted-foreground">Accorder le statut partenaire</p>
                  </div>
                  <Switch
                    checked={detailUser.is_partner}
                    disabled={detailLoading || verifyingPartner}
                    onCheckedChange={() => setConfirmPartnerToggle(!detailUser.is_partner)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction USSD</Label>
                    <p className="text-xs text-muted-foreground">Autoriser les transactions USSD</p>
                  </div>
                  <Switch
                    checked={detailUser.can_process_ussd_transaction}
                    disabled={detailLoading || verifyingUssd}
                    onCheckedChange={() => setConfirmUssdToggle(!detailUser.can_process_ussd_transaction)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Créé le</Label>
                  <span className="text-sm">{detailUser.created_at ? detailUser.created_at.split("T")[0] : "-"}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Dernière connexion</Label>
                  <span className="text-sm">{detailUser.last_login_at ? detailUser.last_login_at.split("T")[0] : "-"}</span>
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

      {/* Confirmation Modals */}
      <Dialog open={confirmEmailToggle !== null} onOpenChange={(open) => { if (!open) setConfirmEmailToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmEmailToggle ? "Vérifier l'email" : "Ne pas vérifier l'email"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmEmailToggle
              ? "Êtes-vous sûr de vouloir vérifier l'email de cet utilisateur ?"
              : "Êtes-vous sûr de vouloir ne pas vérifier l'email de cet utilisateur ?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleToggleEmailVerified(!!confirmEmailToggle);
                setConfirmEmailToggle(null);
              }}
              disabled={verifyingEmail}
            >
              {verifyingEmail ? "Vérification..." : "Confirmer"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmEmailToggle(null)}
              disabled={verifyingEmail}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPhoneToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPhoneToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmPhoneToggle ? "Vérifier le téléphone" : "Ne pas vérifier le téléphone"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmPhoneToggle
              ? "Êtes-vous sûr de vouloir vérifier le téléphone de cet utilisateur ?"
              : "Êtes-vous sûr de vouloir ne pas vérifier le téléphone de cet utilisateur ?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleTogglePhoneVerified(!!confirmPhoneToggle);
                setConfirmPhoneToggle(null);
              }}
              disabled={verifyingPhone}
            >
              {verifyingPhone ? "Vérification..." : "Confirmer"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmPhoneToggle(null)}
              disabled={verifyingPhone}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmPartnerToggle !== null} onOpenChange={(open) => { if (!open) setConfirmPartnerToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmPartnerToggle ? "Activer le statut partenaire" : "Désactiver le statut partenaire"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmPartnerToggle
              ? "Êtes-vous sûr de vouloir activer le statut partenaire ?"
              : "Êtes-vous sûr de vouloir désactiver le statut partenaire ?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleTogglePartner(!!confirmPartnerToggle);
                setConfirmPartnerToggle(null);
              }}
              disabled={verifyingPartner}
            >
              {verifyingPartner ? "Modification..." : "Confirmer"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmPartnerToggle(null)}
              disabled={verifyingPartner}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmUssdToggle !== null} onOpenChange={(open) => { if (!open) setConfirmUssdToggle(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmUssdToggle ? "Activer la transaction USSD" : "Désactiver la transaction USSD"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmUssdToggle
              ? "Êtes-vous sûr de vouloir activer les transactions USSD pour cet utilisateur ?"
              : "Êtes-vous sûr de vouloir désactiver les transactions USSD pour cet utilisateur ?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                await handleToggleUssdTransaction(!!confirmUssdToggle);
                setConfirmUssdToggle(null);
              }}
              disabled={verifyingUssd}
            >
              {verifyingUssd ? "Vérification..." : "Confirmer"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setConfirmUssdToggle(null)}
              disabled={verifyingUssd}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmActionType} onOpenChange={(open) => { if (!open) { setConfirmActionType(null); setConfirmActionUser(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmActionType === "activate"
                ? "Activer l'utilisateur"
                : "Désactiver l'utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            {confirmActionType === "activate"
              ? "Êtes-vous sûr de vouloir activer cet utilisateur ?"
              : "Êtes-vous sûr de vouloir désactiver cet utilisateur ?"}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={async () => {
                if (confirmActionUser) {
                  if (confirmActionType === "activate") {
                    await handleActivate(confirmActionUser);
                  } else {
                    await handleDeactivate(confirmActionUser);
                  }
                }
                setConfirmActionType(null);
                setConfirmActionUser(null);
              }}
              disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
            >
              {confirmActionType === "activate"
                ? "Activer"
                : "Désactiver"}
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                setConfirmActionType(null);
                setConfirmActionUser(null);
              }}
              disabled={activatingUid === confirmActionUser?.uid || deactivatingUid === confirmActionUser?.uid}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}