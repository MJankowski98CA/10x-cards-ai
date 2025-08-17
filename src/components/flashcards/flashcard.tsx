'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CheckIcon, PencilIcon, TrashIcon, XIcon, PlayIcon } from 'lucide-react'

import { approveFlashcard, deleteFlashcard } from '@/app/flashcards/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FlashcardDto } from '@/types'

interface FlashcardProps {
  flashcard: FlashcardDto
}

export function Flashcard({ flashcard }: FlashcardProps) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveFlashcard(flashcard.id)
      if (result.success) {
        toast.success('Flashcard has been approved.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteFlashcard(flashcard.id)
      if (result.success) {
        toast.success('Flashcard has been deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const isPendingStatus = flashcard.status === 'pending'
  const isAiGenerated = flashcard.source === 'ai'

  const studyLink = new URLSearchParams(searchParams)
  studyLink.set('start_id', flashcard.id.toString())

  return (
    <Card
      className={cn(
        'flex h-full flex-col justify-between',
        isAiGenerated && 'border-purple-300 dark:border-purple-800',
        isAiGenerated &&
          isPendingStatus &&
          'bg-purple-50/50 dark:bg-purple-900/10',
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg">{flashcard.front}</CardTitle>
        {isAiGenerated && (
          <CardDescription className="text-purple-600 dark:text-purple-400">
            AI Generated
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p>{flashcard.back}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-1">
          {isPendingStatus ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="text-green-500"
                onClick={handleApprove}
                disabled={isPending}
                aria-label="Approve flashcard"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500"
                    disabled={isPending}
                    aria-label="Reject flashcard"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to reject?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This flashcard will be permanently deleted. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handleDelete}
                      disabled={isPending}
                    >
                      Reject and Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              asChild
              aria-label="Start study session"
            >
              <Link href={`/flashcards/study?${studyLink.toString()}`}>
                <PlayIcon className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="icon"
            variant="ghost"
            asChild
            aria-label="Edit flashcard"
          >
            <Link href={`/flashcards/${flashcard.id}/edit`}>
              <PencilIcon className="h-4 w-4" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-500"
                aria-label="Delete flashcard"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  flashcard from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}
