"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Copy, ArrowLeft, Save, RefreshCw, FileText, Phone, User, Calendar, DollarSign, Network, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

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

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function EditTransactionPage() {
  const { uid } = useParams()
  const { t } = useLanguage()
  const apiFetch = useApi()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [transaction, setTransaction] = useState<any>(null)
  const [form, setForm] = useState({
    recipient_name: "",
    objet: "",
    external_transaction_id: "",
    raw_sms: "",
    processed_by_phone: "",
  })

  // Transaction logs state
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState("")

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`${baseUrl}/api/payments/transactions/${uid}/`)
        setTransaction(data)
        setForm({
          recipient_name: data.recipient_name || data.display_recipient_name || "",
          objet: data.objet || "",
          external_transaction_id: data.external_transaction_id || "",
          raw_sms: data.raw_sms || "",
          processed_by_phone: data.processed_by_phone || "",
        })
      } catch (err: any) {
        setError(extractErrorMessages(err) || t("transactions.failedToLoad"))
      } finally {
        setLoading(false)
      }
    }
    fetchTransaction()
  }, [uid])

  // Fetch transaction logs
  const fetchTransactionLogs = async () => {
    setLogsLoading(true)
    setLogsError("")
    try {
      const data = await apiFetch(`${baseUrl}/api/payments/transaction-logs/?transaction=${uid}`)
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
      setLogs(items)
    } catch (err: any) {
      setLogsError(extractErrorMessages(err) || (t("transactions.failedToLoad") || "Failed to load"))
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (uid) fetchTransactionLogs()
  }, [uid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const [copied, setCopied] = useState(false)
  const handleCopyReference = () => {
    if (transaction?.reference) {
      navigator.clipboard.writeText(transaction.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const payload = {
        recipient_name: form.recipient_name,
        objet: form.objet,
        external_transaction_id: form.external_transaction_id,
        raw_sms: form.raw_sms,
        processed_by_phone: form.processed_by_phone,
      }
      await apiFetch(`${baseUrl}/api/payments/transactions/${uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      router.push("/dashboard/transactions")
    } catch (err: any) {
      setError(extractErrorMessages(err) || t("transactions.failedToUpdate"))
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    } as const

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
        {status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'cancelled' && <AlertTriangle className="h-3 w-3 mr-1" />}
        {t(`transactions.${status}`)}
      </Badge>
    )
  }

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
              Modifier la transaction
            </h1>
            <p className="text-muted-foreground">
              Mettre à jour les détails de la transaction et consulter les journaux
            </p>
          </div>
        </div>
        <ErrorDisplay error={error} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Modifier la transaction
          </h1>
          <p className="text-muted-foreground">
            Mettre à jour les détails de la transaction et consulter les journaux
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              ID: {uid}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Transaction Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Détails de la transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Référence</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{transaction.reference}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyReference}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {copied && <span className="text-xs text-green-600">Copié!</span>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Montant</div>
              <div className="font-medium">{transaction.amount}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Réseau</div>
              <div className="font-medium">{transaction.network_name}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Destinataire</div>
              <div className="font-medium">
                {transaction.display_recipient_name || transaction.recipient_name}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Téléphone du destinataire</div>
              <div className="font-medium">{transaction.recipient_phone}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Créé</div>
              <div className="font-medium">
                {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Statut</div>
              <div>{getStatusBadge(transaction.status)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Traité par</div>
              <div className="font-medium">{transaction.processed_by_name}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Frais</div>
              <div className="font-medium">{transaction.fees ?? "-"}</div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="mt-6 p-4 bg-accent/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-3">Informations sur le solde</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Solde avant</div>
                <div className="font-medium">{transaction.balance_before ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Solde après</div>
                <div className="font-medium">{transaction.balance_after ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <Badge variant="outline">{t(`transactions.${transaction.type}`)}</Badge>
              </div>
            </div>
          </div>

          {/* Messages */}
          {(transaction.confirmation_message || transaction.error_message) && (
            <div className="mt-6 space-y-4">
              {transaction.confirmation_message && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Message de confirmation</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">{transaction.confirmation_message}</div>
                </div>
              )}
              {transaction.error_message && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">Message d'erreur</span>
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">{transaction.error_message}</div>
                </div>
              )}
            </div>
          )}

          {/* USSD Path */}
          {transaction.ussd_path && Array.isArray(transaction.ussd_path) && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Chemin USSD</h3>
              <div className="bg-accent/50 p-4 rounded-lg">
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                  {transaction.ussd_path.map((step: string, idx: number) => {
                    const [key, ...rest] = step.split(":")
                    const value = rest.join(":").trim()
                    return (
                      <div key={idx} className="mb-3 last:mb-0">
                        <span className="font-bold text-primary">{key}:</span>{" "}
                        <span>{value}</span>
                      </div>
                    )
                  })}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Modifier la transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("transactions.recipientName") || "Recipient Name"}
                </label>
                <Input 
                  name="recipient_name" 
                  value={form.recipient_name} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Objet</label>
                <Input 
                  name="objet" 
                  value={form.objet} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("transactions.externalTransactionId")}
                </label>
                <Input 
                  name="external_transaction_id" 
                  value={form.external_transaction_id} 
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("transactions.rawSms")}
                </label>
                <Textarea 
                  name="raw_sms" 
                  value={form.raw_sms} 
                  onChange={handleChange} 
                  rows={4} 
                  placeholder="Entrer le contenu du SMS brut..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Traité par téléphone
                </label>
                <Input 
                  name="processed_by_phone" 
                  value={form.processed_by_phone} 
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t("transactions.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("transactions.saveChanges")}
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("transactionLogs.title") || "Transaction Logs"}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTransactionLogs} 
              disabled={logsLoading}
            >
              {logsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Chargement...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("common.refresh") || "Refresh"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsError && (
            <div className="mb-6">
              <ErrorDisplay error={logsError} onRetry={fetchTransactionLogs} />
            </div>
          )}
          {logsLoading && !logs.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Chargement des journaux...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("transactionLogs.empty") || "Aucun journal pour cette transaction."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: any, idx: number) => (
                <div key={log.uid || log.id || idx} className="bg-accent/50 rounded-lg p-4 border">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-primary/10 rounded">
                        <FileText className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.created_at || log.timestamp || Date.now()).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.type || log.event || log.status || "event"}
                    </Badge>
                  </div>
                  {log.message && (
                    <div className="text-sm text-foreground mb-3">{log.message}</div>
                  )}
                  {(log.data || log.payload || log.meta) && (
                    <div className="bg-background p-3 rounded border">
                      <pre className="text-xs whitespace-pre-wrap break-words text-foreground">
                        {JSON.stringify(log.data || log.payload || log.meta, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
