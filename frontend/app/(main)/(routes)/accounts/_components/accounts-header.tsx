'use client'

import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AccountsHeaderProps {
  onAdd: () => void
  search: string
  setSearch: (value: string) => void
}

export const AccountsHeader = ({ onAdd, search, setSearch }: AccountsHeaderProps) => {
  return (
    <div className="space-y-6 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
        <Button onClick={onAdd} variant="ghost" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-semibold flex items-center gap-1">
          <Plus className="h-5 w-5" />
          Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-none rounded-xl h-12 focus-visible:ring-1 focus-visible:ring-zinc-200"
        />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground uppercase tracking-tight">Bank</h2>
      </div>
    </div>
  )
}
