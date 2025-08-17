import { Button } from '@/components/ui/button'
import { signOut } from '@/app/(auth)/actions'
import { LogOut, PlusIcon } from 'lucide-react'
import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Moje Fiszki</h1>
      <div className="flex items-center space-x-2">
        <Button asChild>
          <Link href="/generate">
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Generuj</span>
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/flashcards/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            <span>Dodaj</span>
          </Link>
        </Button>

        <div style={{ width: '48px' }} />

        <form action={signOut}>
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Wyloguj</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
