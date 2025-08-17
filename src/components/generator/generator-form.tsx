'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { CreateGenerationSchema } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { generateFlashcards } from '@/app/generate/actions'
import { Loader2 } from 'lucide-react'

export function GeneratorForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<z.input<typeof CreateGenerationSchema>>({
    resolver: zodResolver(CreateGenerationSchema),
    defaultValues: {
      source_text: '',
      count: [10],
    },
  })

  function onSubmit(values: z.output<typeof CreateGenerationSchema>) {
    const formData = new FormData()
    formData.append('source_text', values.source_text)
    formData.append('count', String(values.count))

    startTransition(async () => {
      const result = await generateFlashcards(formData)

      if (result.success) {
        toast.success('Fiszki zostały wygenerowane!')
        router.push('/?view=pending')
      } else {
        toast.error('Wystąpił błąd', {
          description: result.error,
        })
      }
    })
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Generator AI</CardTitle>
            <CardDescription>
              Wprowadź tekst źródłowy, a my wygenerujemy dla Ciebie fiszki.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="source_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tekst źródłowy</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wklej tutaj swój tekst..."
                      className="min-h-[200px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Liczba fiszek</FormLabel>
                  <FormControl>
                    <Slider
                      min={10}
                      max={30}
                      step={1}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Wybrana liczba fiszek: {field.value[0]}
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generuj
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
