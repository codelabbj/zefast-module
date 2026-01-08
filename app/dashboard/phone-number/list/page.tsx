"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown, Phone, Filter, CheckCircle, XCircle, Globe, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// Colors for consistent theming - using logo colors
const COLORS = {
  primary: '#FF6B35', // Orange (primary from logo)
  secondary: '#00FF88', // Bright green from logo
  accent: '#1E3A8A', // Dark blue from logo
  danger: '#EF4444',
  warning: '#F97316',
  success: '#00FF88', // Using bright green for success
  info: '#1E3A8A', // Using dark blue for info
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function PhoneNumberListPage() {
  const [numbers, setNumbers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [networks, setNetworks] = useState<any[]>([])
  const [sortField, setSortField] = useState<"phone_number" | "network" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || networkFilter !== "all" || sortField) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (networkFilter !== "all") {
            params.append("network", networkFilter);
          }
          if (sortField) {
            params.append("ordering", `${sortDirection === "+" ? "+" : "-"}${sortField}`);
          }
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/numeros/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/numeros/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setNumbers(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("phoneNumbers.success"),
          description: t("phoneNumbers.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("phoneNumbers.failedToLoad")
        setError(errorMessage)
        setNumbers([])
        toast({
          title: t("phoneNumbers.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Phone numbers fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPhoneNumbers()
  }, [searchTerm, networkFilter, sortField, sortDirection])

  // Fetch networks for filter
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("phoneNumbers.networksLoaded"),
          description: t("phoneNumbers.networksLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("phoneNumbers.failedToLoadNetworks")
        console.error('Networks fetch error:', err)
        setNetworks([])
        toast({
          title: t("phoneNumbers.networksFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    fetchNetworks()
  }, [])

  const filteredNumbers = numbers

  const handleSort = (field: "phone_number" | "network") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t("phoneNumbers.list") || "Phone Numbers"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérer les numéros de téléphone et leurs associations de réseau
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {numbers.length} numéros
            </span>
          </div>
          {/* <Link href="/dashboard/phone-number/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un numéro
            </Button>
          </Link> */}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des numéros de téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Network Filter */}
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par réseau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les réseaux</SelectItem>
                {networks.map((network) => (
                  <SelectItem key={network.id || network.uid} value={network.id || network.uid}>
                    {network.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select 
              value={sortField || ""} 
              onValueChange={(value) => setSortField(value as "phone_number" | "network" | null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone_number">Numéro de téléphone</SelectItem>
                <SelectItem value="network">Réseau</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Phone Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Liste des numéros de téléphone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des numéros de téléphone...</span>
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
                    <TableHead className="font-semibold">Numéro de téléphone</TableHead>
                    <TableHead className="font-semibold">Réseau</TableHead>
                    <TableHead className="font-semibold">Pays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNumbers.map((number) => (
                    <TableRow key={number.id || number.uid} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground font-mono">
                              {number.phone_number || number.number || 'Inconnu'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {number.description || 'Aucune description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {number.network?.nom || number.network_name || 'Inconnu'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {number.country?.nom || number.country_name || 'Inconnu'}
                        </Badge>
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
      {!loading && !error && filteredNumbers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent mx-auto flex items-center justify-center">
                <Phone className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Aucun numéro de téléphone trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? `Aucun numéro de téléphone ne correspond à "${searchTerm}"` : "Aucun numéro de téléphone n'a encore été ajouté."}
                </p>
              </div>
              <Link href="/dashboard/phone-number/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier numéro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 