'use client'

import { useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  FlashcardFormSchema,
  type FlashcardFormViewModel,
} from '@/lib/validators'
import type { FlashcardDto } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { createFlashcard, updateFlashcard } from '@/app/flashcards/actions'

interface FlashcardFormProps {
  initialData?: FlashcardDto
}

export function FlashcardForm({ initialData }: FlashcardFormProps) {
  const isEditMode = Boolean(initialData)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FlashcardFormViewModel>({
    resolver: zodResolver(FlashcardFormSchema),
    defaultValues: {
      front: initialData?.front ?? '',
      back: initialData?.back ?? '',
    },
  })

  function onSubmit(values: FlashcardFormViewModel) {
    startTransition(async () => {
      if (isEditMode && initialData) {
        const result = await updateFlashcard(
          initialData.id,
          initialData,
          values,
        )
        if (result?.error) {
          toast.error(result.error)
        }
      } else {
        const result = await createFlashcard(values)
        if (result?.error) {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? 'Edytuj fiszkę' : 'Nowa fiszka'}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? 'Wprowadź zmiany w swojej fiszce.'
                : 'Wypełnij poniższe pola, aby dodać nową fiszkę.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Przód</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wpisz treść przodu fiszki..."
                      className="resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tył</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wpisz treść tyłu fiszki..."
                      className="resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Zapisywanie...'
                : isEditMode
                  ? 'Zapisz zmiany'
                  : 'Utwórz'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
