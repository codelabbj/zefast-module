'use client'
import { SignInForm } from "@/components/auth/sign-in-form"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check for accessToken cookie
    if (typeof document !== 'undefined') {
      const hasToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith('accessToken='))
      if (hasToken) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
  }, [router])

  if (checking) {
    // Show a minimalist loading screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {/* <img src="/logo.png" alt="Pal Module Logo" className="h-16 w-16 animate-pulse" /> */}
            <div className="absolute -top-1 -right-1">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                <Loader2 className="h-3 w-3 text-white animate-spin" />
              </div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gradient">Pal Module</h1>
            <p className="text-muted-foreground">Vérification de la session...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SignInForm />
    </div>
  )
}