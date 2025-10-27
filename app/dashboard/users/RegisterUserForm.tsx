"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, Save, Loader2, UserPlus, Mail, Phone, User, Shield, CheckCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function RegisterUserForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    identifier: "",
    password: "",
    password_confirm: "",
    is_partner: false,
    can_process_ussd_transaction: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t } = useLanguage();
  const apiFetch = useApi();
  const { toast } = useToast();
  const router = useRouter();

  // Get base URL and token from env
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const apiToken = process.env.NEXT_PUBLIC_API_TOKEN || ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (form.password !== form.password_confirm) {
      setError("Les mots de passe ne correspondent pas")
      toast({
        title: "Échec de l'inscription",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiToken) {
        headers["Authorization"] = `Bearer ${apiToken}`
      }
      // Map identifier to email or phone for backend compatibility
      const isEmail = /@/.test(form.identifier)
      const submitBody = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: isEmail ? form.identifier : null,
        phone: isEmail ? null : form.identifier,
        password: form.password,
        password_confirm: form.password_confirm,
        is_partner: form.is_partner,
        can_process_ussd_transaction: form.can_process_ussd_transaction,
      }
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/register/`, {
        method: "POST",
        headers,
        body: JSON.stringify(submitBody),
      })
      if (data && data.detail) {
        const backendError = extractErrorMessages(data)
        setError(backendError)
        toast({
          title: "Échec de l'inscription",
          description: backendError,
          variant: "destructive",
        })
      } else {
        setSuccess("Utilisateur enregistré avec succès")
        toast({
          title: "Succès",
          description: "Utilisateur enregistré avec succès",
        })
        setForm({
          first_name: "",
          last_name: "",
          identifier: "",
          password: "",
          password_confirm: "",
          is_partner: false,
          can_process_ussd_transaction: false,
        })
      }
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Échec de l'inscription"
      setError(errorMessage)
      toast({
        title: "Échec de l'inscription",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isEmail = /@/.test(form.identifier)
  const isFormValid = form.first_name && form.last_name && form.identifier && form.password && form.password_confirm

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2 hover-lift"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gradient">
              Enregistrer un utilisateur
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Créer un nouveau compte utilisateur dans le système
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Nouvel utilisateur
          </span>
        </div>
      </div>

      {error && (
        <Card className="minimal-card">
          <CardContent className="p-6">
            <ErrorDisplay error={error} />
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="minimal-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span>Informations personnelles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium text-foreground">
                  Prénom *
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Entrez le prénom"
                  className="minimal-input"
                  variant="minimal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium text-foreground">
                  Nom de famille *
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Entrez le nom de famille"
                  className="minimal-input"
                  variant="minimal"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-green-500" />
              </div>
              <span>Informations de contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
                Email ou téléphone *
              </Label>
              <Input
                id="identifier"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="Entrez l'email ou le numéro de téléphone"
                className="minimal-input"
                variant="minimal"
                required
              />
              <p className="text-xs text-muted-foreground">
                Entrez soit une adresse email soit un numéro de téléphone
              </p>
              {form.identifier && (
                <div className="flex items-center gap-2 mt-2">
                  {isEmail ? (
                    <>
                      <Mail className="h-4 w-4 text-green-500" />
                      <Badge variant="info">Email</Badge>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 text-green-500" />
                      <Badge variant="success">Téléphone</Badge>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <span>Sécurité</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Entrez le mot de passe"
                  className="minimal-input"
                  variant="minimal"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères avec lettres et chiffres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm" className="text-sm font-medium text-foreground">
                  Confirmer le mot de passe *
                </Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirmez le mot de passe"
                  className="minimal-input"
                  variant="minimal"
                  required
                />
                {form.password_confirm && (
                  <div className="flex items-center gap-2 mt-2">
                    {form.password === form.password_confirm ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="success">Correspond</Badge>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive">Ne correspond pas</Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Type */}
        <Card className="minimal-card hover-lift">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-500" />
              </div>
              <span>Type d'utilisateur</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="is_partner" className="text-sm font-medium text-foreground">
                  Enregistrer comme partenaire
                </Label>
                <p className="text-xs text-muted-foreground">
                  Les partenaires ont accès au suivi des commissions et à des fonctionnalités supplémentaires
                </p>
              </div>
              <Switch
                id="is_partner"
                name="is_partner"
                checked={form.is_partner}
                onCheckedChange={(checked) => setForm({ ...form, is_partner: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="can_process_ussd_transaction" className="text-sm font-medium text-foreground">
                  Autoriser les transactions USSD
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permet à cet utilisateur de traiter des transactions USSD
                </p>
              </div>
              <Switch
                id="can_process_ussd_transaction"
                name="can_process_ussd_transaction"
                checked={form.can_process_ussd_transaction}
                onCheckedChange={(checked) => setForm({ ...form, can_process_ussd_transaction: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {isFormValid && (
          <Card className="minimal-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Aperçu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 p-4 bg-accent/20 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {form.first_name.charAt(0).toUpperCase()}{form.last_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {form.first_name} {form.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {form.identifier}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {isEmail ? (
                    <Badge variant="info">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      <Phone className="h-3 w-3 mr-1" />
                      Téléphone
                    </Badge>
                  )}
                  {form.is_partner && (
                    <Badge variant="warning">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Partenaire
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            className="hover-lift"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !isFormValid || form.password !== form.password_confirm}
            className="min-w-[180px] hover-lift"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer l'utilisateur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}