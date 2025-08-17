'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'

interface FlashcardListControlsProps {
  initialView: 'approved' | 'pending'
  initialSource: 'all' | 'ai' | 'manual'
}

export function FlashcardListControls({
  initialView,
  initialSource,
}: FlashcardListControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleViewChange = (newView: 'approved' | 'pending') => {
    if (!newView) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    params.delete('page')
    if (newView === 'pending') {
      params.delete('source')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSourceChange = (newSource: 'all' | 'ai' | 'manual') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', newSource)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between">
      <ToggleGroup
        type="single"
        value={initialView}
        onValueChange={handleViewChange}
        aria-label="Flashcard view"
      >
        <ToggleGroupItem value="approved" aria-label="Approved flashcards">
          Zatwierdzone
        </ToggleGroupItem>
        <ToggleGroupItem value="pending" aria-label="Pending flashcards">
          Do zatwierdzenia
        </ToggleGroupItem>
      </ToggleGroup>

      {initialView === 'approved' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Źródło: {sourceToLabel(initialSource)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filtruj wg źródła</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSourceChange('all')}>
              Wszystkie
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSourceChange('ai')}>
              Wygenerowane (AI)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSourceChange('manual')}>
              Dodane ręcznie
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function sourceToLabel(source: 'all' | 'ai' | 'manual'): string {
  switch (source) {
    case 'ai':
      return 'AI'
    case 'manual':
      return 'Manualne'
    default:
      return 'Wszystkie'
  }
}
