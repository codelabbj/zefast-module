"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  BarChart3,
  CreditCard,
  Waves,
  Smartphone,
  MessageSquare,
  Bell,
  Globe,
  Phone,
  Monitor,
  Settings,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  DollarSign as DollarIcon,
  PieChart,
  LineChart,
  TrendingDown
} from "lucide-react"
import { ErrorDisplay } from "@/components/ui/error-display"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://connect.api.blaffa.net"

// TypeScript interfaces for API responses
interface DashboardSummary {
  today_transactions: number
  today_completed: number
  today_revenue: number
  today_success_rate: number
  online_devices: number
  pending_transactions: number
  last_updated: string
}

interface NotificationStats {
  task_stats: {
    active: number
    scheduled: number
    reserved: number
  }
  user_stats: {
    total_users: number
    active_users: number
    pending_users: number
    verified_users: number
    users_registered_today: number
    users_registered_week: number
  }
  code_stats: {
    pending_password_reset: number
    pending_email_verification: number
    pending_phone_verification: number
  }
  notification_info: {
    email_service: string
    sms_service: string
    async_enabled: boolean
    logging_enabled: boolean
  }
  timestamp: string
}

interface TransactionStats {
  total_transactions: number
  completed_transactions: number
  success_transactions: number
  failed_transactions: number
  pending_transactions: number
  processing_transactions: number
  total_amount: string
  success_rate: string
  avg_processing_time: number | null
  deposits_count: number
  withdrawals_count: number
  deposits_amount: string
  withdrawals_amount: string
}

interface SystemEvent {
  uid: string
  device: string
  device_id: string
  event_type: string
  description: string
  level: string
  data: any
  created_at: string
}

interface SystemEventsResponse {
  count: number
  next: string | null
  previous: string | null
  results: SystemEvent[]
}

interface BalanceOperationsStats {
  period_days: number
  start_date: string
  adjustments: {
    total_count: number
    total_credits: {
      count: number
      total: number | null
    }
    total_debits: {
      count: number
      total: number | null
    }
    by_admin: any[]
  }
  refunds: {
    total_count: number
    total_amount: number
    by_admin: Array<{
      created_by__first_name: string
      created_by__last_name: string
      created_by__email: string
      count: number
      total_amount: number
    }>
  }
  generated_at: string
}

interface RechargeRequestStats {
  total_requests: number
  pending_review: number
  total_approved_amount: number
  by_status: {
    pending: { name: string; count: number }
    proof_submitted: { name: string; count: number }
    under_review: { name: string; count: number }
    approved: { name: string; count: number }
    rejected: { name: string; count: number }
    cancelled: { name: string; count: number }
  }
  month_stats: {
    total_requests: number
    approved_count: number
    approved_amount: number
    approval_rate: number
  }
}

interface MomoPayStats {
  total_transactions: number
  pending_count: number
  confirmed_count: number
  expired_count: number
  cancelled_count: number
  total_amount_confirmed: number
  confirmation_rate: number
}

interface WaveBusinessStats {
  total_transactions: number
  pending_count: number
  confirmed_count: number
  expired_count: number
  cancelled_count: number
  total_amount_confirmed: number
  confirmation_rate: number
}

// Ultra-minimalist color Zefastette
const COLORS = {
  primary: '#00A86B',
  secondary: '#6B7280',
  accent: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}

const CHART_COLORS = ['#00A86B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#84CC16']

export default function Dashboard() {
  const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()
  const { toast } = useToast()
  const api = useApi()

  // State for all API data
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null)
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null)
  const [systemEvents, setSystemEvents] = useState<SystemEventsResponse | null>(null)
  const [balanceOperations, setBalanceOperations] = useState<BalanceOperationsStats | null>(null)
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequestStats | null>(null)
  const [momoPayStats, setMomoPayStats] = useState<MomoPayStats | null>(null)
  const [waveBusinessStats, setWaveBusinessStats] = useState<WaveBusinessStats | null>(null)

  // Helper function to add timeout to API calls
  const apiWithTimeout = async (url: string, timeoutMs: number = 10000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
    
    return Promise.race([
      api(url),
      timeoutPromise
    ])
  }

  // Helper function to retry API calls with exponential backoff
  const apiWithRetry = async (url: string, maxRetries: number = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiWithTimeout(url, 10000)
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

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if baseUrl is set
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_API_BASE_URL is not set')
        setError('URL de base de l\'API non configurée')
        setIsLoading(false)
        return
      }

      console.log('Fetching data from:', baseUrl)

      // Fetch all API data in parallel with timeout protection and retry
      const [
        summaryRes,
        notificationRes,
        transactionRes,
        systemEventsRes,
        balanceOperationsRes,
        rechargeRequestsRes,
        momoPayRes,
        waveBusinessRes
      ] = await Promise.allSettled([
        apiWithRetry(`${baseUrl}/api/payments/dashboard/summary/`),
        apiWithRetry(`${baseUrl}/api/auth/admin/notifications/stats/`),
        apiWithRetry(`${baseUrl}/api/payments/stats/transactions/`),
        apiWithRetry(`${baseUrl}/api/payments/system-events/`),
        apiWithRetry(`${baseUrl}/api/payments/admin/balance-operations/stats/`),
        apiWithRetry(`${baseUrl}/api/payments/user/recharge_requests/stats/`),
        apiWithRetry(`${baseUrl}/api/payments/momo-pay-transactions/stats/`),
        apiWithRetry(`${baseUrl}/api/payments/wave-business-transactions/stats/`)
      ])

      // Process results
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        console.log('Dashboard summary loaded:', summaryRes.value)
        setDashboardSummary(summaryRes.value)
      }
      if (notificationRes.status === 'fulfilled' && notificationRes.value) {
        console.log('Notification stats loaded:', notificationRes.value)
        setNotificationStats(notificationRes.value)
      }
      if (transactionRes.status === 'fulfilled' && transactionRes.value) {
        console.log('Transaction stats loaded:', transactionRes.value)
        setTransactionStats(transactionRes.value)
      }
      if (systemEventsRes.status === 'fulfilled' && systemEventsRes.value) {
        console.log('System events loaded:', systemEventsRes.value)
        setSystemEvents(systemEventsRes.value)
      }
      if (balanceOperationsRes.status === 'fulfilled' && balanceOperationsRes.value) {
        console.log('Balance operations loaded:', balanceOperationsRes.value)
        setBalanceOperations(balanceOperationsRes.value)
      }
      if (rechargeRequestsRes.status === 'fulfilled' && rechargeRequestsRes.value) {
        console.log('Recharge requests loaded:', rechargeRequestsRes.value)
        setRechargeRequests(rechargeRequestsRes.value)
      }
      if (momoPayRes.status === 'fulfilled' && momoPayRes.value) {
        console.log('MoMo Pay stats loaded:', momoPayRes.value)
        setMomoPayStats(momoPayRes.value)
      }
      if (waveBusinessRes.status === 'fulfilled' && waveBusinessRes.value) {
        console.log('Wave Business stats loaded:', waveBusinessRes.value)
        setWaveBusinessStats(waveBusinessRes.value)
      }

      // Check for any failures
      const failures = [
        summaryRes, notificationRes, transactionRes, systemEventsRes,
        balanceOperationsRes, rechargeRequestsRes, momoPayRes, waveBusinessRes
      ].filter(result => result.status === 'rejected')

      if (failures.length > 0) {
        console.warn(`${failures.length} API calls failed:`, failures.map(f => f.reason))
        
        // Check if failures are due to timeout
        const timeoutFailures = failures.filter(f => 
          f.reason?.message?.includes('Request timeout')
        )
        
        if (timeoutFailures.length > 0) {
          console.warn(`${timeoutFailures.length} API calls timed out`)
          toast({
            title: "Timeout des requêtes",
            description: `${timeoutFailures.length} requêtes ont expiré. Vérifiez votre connexion réseau.`,
            variant: "destructive",
          })
        }
        
        // If all API calls failed, show demo data
        if (failures.length === 8) {
          console.log('All API calls failed, showing demo data')
          setError('Impossible de se connecter à l\'API. Affichage des données de démonstration.')
          setDashboardSummary({
            today_transactions: 11,
            today_completed: 3,
            today_revenue: 51000.0,
            today_success_rate: 27.27,
            online_devices: 3,
            pending_transactions: 0,
            last_updated: new Date().toISOString()
          })
          setNotificationStats({
            task_stats: { active: 0, scheduled: 0, reserved: 0 },
            user_stats: { total_users: 7, active_users: 6, pending_users: 1, verified_users: 6, users_registered_today: 0, users_registered_week: 4 },
            code_stats: { pending_password_reset: 0, pending_email_verification: 0, pending_phone_verification: 0 },
            notification_info: { email_service: "SendGrid", sms_service: "Pending (Twilio integration)", async_enabled: true, logging_enabled: true },
            timestamp: new Date().toISOString()
          })
          setTransactionStats({
            total_transactions: 69,
            completed_transactions: 34,
            success_transactions: 27,
            failed_transactions: 5,
            pending_transactions: 0,
            processing_transactions: 0,
            total_amount: "6934131.00",
            success_rate: "39.13",
            avg_processing_time: null,
            deposits_count: 18,
            withdrawals_count: 9,
            deposits_amount: "3583131.00",
            withdrawals_amount: "3351000.00"
          })
        }
      }

      setIsLoading(false)
    } catch (err) {
        setError('Échec du chargement des données du tableau de bord')
      setIsLoading(false)
      console.error('Dashboard data fetch error:', err)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const refreshData = async () => {
    await fetchAllData()
    toast({
      title: "Données Actualisées",
      description: "Les données du tableau de bord ont été mises à jour avec succès.",
    })
  }

  // Chart data preparation
  const transactionStatusData = transactionStats ? [
    { name: 'Réussies', value: transactionStats.success_transactions, color: '#10B981' },
    { name: 'Échouées', value: transactionStats.failed_transactions, color: '#EF4444' },
    { name: 'En Attente', value: transactionStats.pending_transactions, color: '#F59E0B' },
    { name: 'En Cours', value: transactionStats.processing_transactions, color: '#3B82F6' }
  ] : []

  const paymentProviderData = momoPayStats && waveBusinessStats ? [
    { name: 'MoMo Pay', transactions: momoPayStats.total_transactions, confirmed: momoPayStats.confirmed_count, rate: momoPayStats.confirmation_rate },
    { name: 'Wave Business', transactions: waveBusinessStats.total_transactions, confirmed: waveBusinessStats.confirmed_count, rate: waveBusinessStats.confirmation_rate }
  ] : []

  const userStatsData = notificationStats?.user_stats ? [
    { name: 'Total', value: notificationStats.user_stats.total_users, color: '#3B82F6' },
    { name: 'Actifs', value: notificationStats.user_stats.active_users, color: '#10B981' },
    { name: 'En Attente', value: notificationStats.user_stats.pending_users, color: '#F59E0B' },
    { name: 'Vérifiés', value: notificationStats.user_stats.verified_users, color: '#8B5CF6' }
  ] : []

  // Transaction trends data for line chart
  const transactionTrendsData = [
    { name: 'Lun', transactions: 45, revenue: 12000 },
    { name: 'Mar', transactions: 52, revenue: 15000 },
    { name: 'Mer', transactions: 38, revenue: 11000 },
    { name: 'Jeu', transactions: 61, revenue: 18000 },
    { name: 'Ven', transactions: 48, revenue: 14000 },
    { name: 'Sam', transactions: 35, revenue: 9500 },
    { name: 'Dim', transactions: 42, revenue: 12500 }
  ]

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground">
              Real-time insights into your payment platform performance.
            </p>
          </div>
        </div>
        <ErrorDisplay error={error} />
        <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            Le tableau de bord est en mode démo. Veuillez configurer vos points de terminaison API pour voir les vraies données.
          </p>
          <Button 
            onClick={refreshData} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Aperçu du Tableau de Bord
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Aperçus en temps réel des performances de votre plateforme de paiement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Afficher seulement les utilisateurs actifs</span>
            <Switch
              checked={showOnlyActiveUsers}
              onCheckedChange={setShowOnlyActiveUsers}
            />
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Summary - Today's Performance */}
      {dashboardSummary && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Transactions d'Aujourd'hui</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardSummary.today_transactions || 0}</p>
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-green-500 truncate">{dashboardSummary.today_completed || 0} terminées</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ml-3">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Revenus d'Aujourd'hui</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardSummary.today_revenue?.toLocaleString() || '0'} XOF</p>
                <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-green-500 truncate">{dashboardSummary.today_success_rate?.toFixed(1) || '0'}% taux de réussite</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 ml-3">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Appareils en Ligne</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardSummary.online_devices || 0}</p>
                <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-green-500">Actuellement actifs</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Transactions en Attente</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardSummary.pending_transactions || 0}</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-yellow-500 shrink-0" />
                    <span className="text-xs text-yellow-500">En attente de traitement</span>
                </div>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
                </div>
      )}

      {/* User Statistics */}
      {notificationStats?.user_stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs Totaux</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{notificationStats.user_stats.total_users}</p>
                <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-xs text-blue-500">Tous les temps</span>
                </div>
              </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{notificationStats.user_stats.active_users}</p>
                <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-green-500 truncate">{notificationStats.user_stats.users_registered_week} cette semaine</span>
                </div>
              </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs Vérifiés</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{notificationStats.user_stats.verified_users}</p>
                <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-green-500">Email vérifié</span>
                </div>
              </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Utilisateurs en Attente</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{notificationStats.user_stats.pending_users}</p>
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500 shrink-0" />
                    <span className="text-xs text-yellow-500">En attente de vérification</span>
                </div>
              </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 ml-3">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Transaction Statistics Charts */}
      {transactionStats && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Distribution du Statut des Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={transactionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Tendances des Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={transactionTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="transactions" stroke="#00A86B" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Transaction Overview */}
      {transactionStats && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
              Aperçu des Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{transactionStats.success_transactions}</p>
                  <p className="text-sm text-green-600">Réussies</p>
                  </div>
                <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{transactionStats.failed_transactions}</p>
                  <p className="text-sm text-red-600">Échouées</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Montant Total</span>
                    <span className="font-semibold text-sm sm:text-base">{parseFloat(transactionStats.total_amount || '0').toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Taux de Réussite</span>
                  <span className="font-semibold text-green-600">{transactionStats.success_rate}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Dépôts</span>
                    <span className="font-semibold text-sm sm:text-base">{parseFloat(transactionStats.deposits_amount || '0').toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Retraits</span>
                    <span className="font-semibold text-sm sm:text-base">{parseFloat(transactionStats.withdrawals_amount || '0').toLocaleString()} XOF</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Provider Statistics */}
      {momoPayStats && waveBusinessStats && (
        <div className="space-y-6">
          {/* Payment Provider Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comparaison des Fournisseurs de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentProviderData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#3B82F6" name="Transactions Totales" />
                    <Bar dataKey="confirmed" fill="#10B981" name="Confirmées" />
                  </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

          {/* Individual Provider Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Performance MoMo Pay
            </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{momoPayStats.total_transactions}</p>
                      <p className="text-sm text-blue-600">Transactions Totales</p>
                  </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{momoPayStats.confirmed_count}</p>
                      <p className="text-sm text-green-600">Confirmées</p>
                </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taux de Confirmation</span>
                      <span className="font-semibold text-green-600">{(momoPayStats.confirmation_rate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Montant Total</span>
                      <span className="font-semibold">{(momoPayStats.total_amount_confirmed || 0).toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">En Attente</span>
                      <span className="font-semibold text-yellow-600">{momoPayStats.pending_count}</span>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>

            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-primary" />
                  Performance Wave Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{waveBusinessStats.total_transactions}</p>
                      <p className="text-sm text-blue-600">Transactions Totales</p>
                      </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{waveBusinessStats.confirmed_count}</p>
                      <p className="text-sm text-green-600">Confirmées</p>
                      </div>
                    </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taux de Confirmation</span>
                      <span className="font-semibold text-green-600">{(waveBusinessStats.confirmation_rate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Montant Total</span>
                      <span className="font-semibold">{(waveBusinessStats.total_amount_confirmed || 0).toLocaleString()} XOF</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">En Attente</span>
                      <span className="font-semibold text-yellow-600">{waveBusinessStats.pending_count}</span>
                </div>
                  </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* System Events */}
      {systemEvents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Événements Système Récents ({systemEvents.count || 0} au total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {systemEvents.results?.length > 0 ? (
                systemEvents.results.slice(0, 10).map((event) => (
                  <div key={event.uid} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        event.level === 'error' ? 'bg-red-500' : 
                        event.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-foreground">{event.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.device_id} • {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={event.level === 'error' ? 'destructive' : 'secondary'}>
                      {event.event_type}
                      </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée de statut de demande de recharge disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Operations */}
      {balanceOperations && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <DollarIcon className="h-5 w-5 text-primary" />
                Résumé des Remboursements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{balanceOperations.refunds?.total_count || 0}</p>
                  <p className="text-sm text-red-600">Remboursements Totaux</p>
                      </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Montant Total</span>
                    <span className="font-semibold text-red-600">{(balanceOperations.refunds?.total_amount || 0).toLocaleString()} XOF</span>
                      </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Période</span>
                    <span className="font-semibold">{balanceOperations.period_days || 0} jours</span>
                    </div>
                    </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
                Résumé des Ajustements
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{balanceOperations.adjustments?.total_count || 0}</p>
                  <p className="text-sm text-blue-600">Ajustements Totaux</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Crédits</span>
                    <span className="font-semibold text-green-600">{balanceOperations.adjustments?.total_credits?.count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Débits</span>
                    <span className="font-semibold text-red-600">{balanceOperations.adjustments?.total_debits?.count || 0}</span>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Recharge Requests */}
      {rechargeRequests && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Statistiques des Demandes de Recharge
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {rechargeRequests.by_status ? Object.entries(rechargeRequests.by_status).map(([key, status]) => (
                <div key={key} className="text-center p-4 bg-accent/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{status.count || 0}</p>
                  <p className="text-sm text-muted-foreground">{status.name || 'Unknown'}</p>
              </div>
              )) : (
                <div className="col-span-full text-center p-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée de statut de demande de recharge disponible</p>
            </div>
              )}
              </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Demandes Totales</span>
                <span className="font-semibold">{rechargeRequests.total_requests || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant Total Approuvé</span>
                <span className="font-semibold text-green-600">{(rechargeRequests.total_approved_amount || 0).toLocaleString()} XOF</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Service Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">MoMo Pay</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-500">Actif</span>
                </div>
              </div>
              <Smartphone className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 shrink-0 ml-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Wave Business</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-500">Actif</span>
                </div>
              </div>
              <Waves className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 shrink-0 ml-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Service SMS</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-500">Actif</span>
                </div>
              </div>
              <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 shrink-0 ml-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Service FCM</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-500">Actif</span>
                </div>
              </div>
              <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 shrink-0 ml-3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}