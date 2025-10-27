"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Edit, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Settings,
  Clock
} from 'lucide-react';

interface UserProfile {
  uid: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  display_name: string;
  is_verified: boolean;
  contact_method: string;
  created_at: string;
  updated_at: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();

  // Mock profile data for demonstration
  const mockProfile: UserProfile = {
    uid: "user_12345",
    email: "john.doe@example.com",
    phone: "+33123456789",
    first_name: "John",
    last_name: "Doe",
    is_active: true,
    email_verified: true,
    phone_verified: false,
    display_name: "John Doe",
    is_verified: true,
    contact_method: "email",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  };

  // Get token from localStorage (same as sign-in-form and dashboard layout)
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || "";
  }

  useEffect(() => {
    // Redirect if not logged in (no token)
    if (!token) {
      router.push("/");
      return;
    }
    const fetchProfile = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProfile(mockProfile);
        setFormData({
          first_name: mockProfile.first_name,
          last_name: mockProfile.last_name,
          email: mockProfile.email,
          phone: mockProfile.phone,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Erreur',
          description: 'Échec du chargement des données du profil',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast, router, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile as UserProfile);

      setEditing(false);
      toast({
        title: 'Succès',
        description: 'Profil mis à jour avec succès',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg text-muted-foreground">Échec du chargement du profil. Veuillez réessayer plus tard.</p>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">
            Mon profil
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gérez vos informations de compte et paramètres
          </p>
        </div>
        {!editing ? (
          <Button 
            onClick={() => setEditing(true)} 
            variant="outline"
            className="flex items-center gap-2 hover-lift"
          >
            <Edit className="h-4 w-4" />
            Modifier le profil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => setEditing(false)} 
              variant="outline" 
              disabled={loading}
              className="flex items-center gap-2 hover-lift"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="hover-lift"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Overview */}
      <Card className="minimal-card hover-lift">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src="" alt={profile.display_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {getInitials(profile.display_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-3xl font-bold text-foreground">{profile.display_name}</div>
              <div className="text-muted-foreground mt-1">
                Membre depuis {new Date(profile.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={profile.is_active ? "default" : "secondary"}
                >
                  <div className="flex items-center gap-1">
                    {profile.is_active ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{profile.is_active ? 'Actif' : 'Inactif'}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-8">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span>Informations personnelles</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium text-foreground">Prénom</Label>
                  {editing ? (
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="minimal-input"
                      variant="minimal"
                    />
                  ) : (
                    <div className="text-foreground font-medium">{profile.first_name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Nom de famille</Label>
                  {editing ? (
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="minimal-input"
                      variant="minimal"
                    />
                  ) : (
                    <div className="text-foreground font-medium">{profile.last_name}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <span>Informations de contact</span>
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Adresse e-mail</span>
                  </Label>
                  {editing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="minimal-input"
                      variant="minimal"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-medium">{profile.email}</span>
                      {profile.email_verified ? (
                        <Badge variant="success">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Vérifié</span>
                          </div>
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>Non vérifié</span>
                          </div>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Numéro de téléphone</span>
                  </Label>
                  {editing ? (
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="minimal-input"
                      variant="minimal"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-medium">{profile.phone}</span>
                      {profile.phone_verified ? (
                        <Badge variant="success">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Vérifié</span>
                          </div>
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>Non vérifié</span>
                          </div>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Settings className="h-4 w-4 text-purple-500" />
                </div>
                <span>Paramètres du compte</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Statut du compte</div>
                  <Badge 
                    variant={profile.is_active ? "default" : "secondary"}
                  >
                    <div className="flex items-center gap-1">
                      {profile.is_active ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{profile.is_active ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Méthode de contact préférée</div>
                  <Badge variant="info">
                    <div className="flex items-center gap-1">
                      {profile.contact_method === 'email' ? (
                        <Mail className="h-3 w-3" />
                      ) : (
                        <Phone className="h-3 w-3" />
                      )}
                      <span>{profile.contact_method === 'email' ? 'E-mail' : 'Téléphone'}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <span>Informations du compte</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">ID utilisateur</div>
                  <div className="text-foreground font-mono text-sm bg-accent/30 px-2 py-1 rounded">{profile.uid}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Dernière mise à jour</div>
                  <div className="text-foreground">
                    {new Date(profile.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}