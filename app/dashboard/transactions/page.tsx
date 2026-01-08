"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function TransactionsPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Transactions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérer et surveiller toutes les transactions
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="h-5 w-5 text-primary" />
            Liste des transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-[900px]">
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Transactions en cours de développement</p>
                <p className="text-sm text-muted-foreground">Cette page sera bientôt disponible avec toutes les fonctionnalités.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}