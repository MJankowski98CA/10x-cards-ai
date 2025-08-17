# Plan implementacji widoku Formularz Generatora AI

## 1. Przegląd

Widok Generatora AI, dostępny pod ścieżką `/generator`, jest kluczowym elementem aplikacji, umożliwiającym użytkownikom wykorzystanie mocy sztucznej inteligencji do automatycznego tworzenia fiszek. Widok składa się z prostego formularza, w którym użytkownik wkleja tekst źródłowy i wybiera pożądaną liczbę fiszek. Po przesłaniu danych, Server Action komunikuje się z usługą generującą, a po pomyślnym zakończeniu procesu, użytkownik jest automatycznie przekierowywany do listy nowo utworzonych fiszek oczekujących na zatwierdzenie.

## 2. Routing widoku

- **Ścieżka widoku**: `/generator`
- **Ochrona**: Widok jest chroniony i dostępny tylko dla zalogowanych użytkowników. `Middleware` zapewni przekierowanie gości na stronę logowania.

## 3. Struktura komponentów

Komponenty zostaną zbudowane z użyciem biblioteki `Shadcn/ui` w architekturze Next.js App Router, z wyraźnym podziałem na komponent serwerowy (strona) i kliencki (formularz).

```
/generator (Route)
└── GeneratorPage (Komponent Serwerowy)
    └── GeneratorForm (Komponent Kliencki: "use client")
        ├── Form (Wrapper z react-hook-form/Shadcn)
        │   ├── Card
        │   │   ├── CardHeader (Tytuł i opis)
        │   │   ├── CardContent
        │   │   │   ├── FormField (dla source_text)
        │   │   │   │   ├── FormLabel
        │   │   │   │   ├── FormControl -> Textarea
        │   │   │   │   └── FormMessage
        │   │   │   ├── FormField (dla count)
        │   │   │   │   ├── FormLabel
        │   │   │   │   ├── FormControl -> Slider
        │   │   │   │   └── FormDescription (wyświetla aktualną wartość)
        │   │   └── CardFooter
        │   │       └── Button[type=submit] (z obsługą stanu ładowania)
```

## 4. Szczegóły komponentów

### `GeneratorPage` (Komponent Serwerowy)

- **Opis komponentu**: Komponent serwerowy dla ścieżki `/generator`. Jego zadaniem jest renderowanie komponentu `<GeneratorForm />` w głównym layoucie aplikacji.
- **Główne elementy**: `<GeneratorForm />`.
- **Propsy**: Brak.

### `GeneratorForm` (Komponent Kliencki)

- **Opis komponentu**: Komponent kliencki (`"use client"`) zawierający całą logikę formularza. Wykorzystuje `react-hook-form` i `Zod` do zarządzania stanem, walidacji po stronie klienta i obsługi wysyłania danych. Po submisji wywołuje Server Action odpowiedzialną za proces generowania fiszek.
- **Główne elementy**:
  - `<Card>` i jego podkomponenty (`CardHeader`, `CardContent`, `CardFooter`) do strukturyzacji UI.
  - `<Form>` (Shadcn) jako wrapper dla `react-hook-form`.
  - `<Textarea>` (Shadcn) dla tekstu źródłowego.
  - `<Slider>` (Shadcn) do wyboru liczby fiszek.
  - `<Button>` (Shadcn) do wysłania formularza.
- **Obsługiwane interakcje**:
  - Wprowadzanie tekstu w polu `source_text`.
  - Zmiana wartości `count` za pomocą suwaka.
  - Wysłanie formularza przyciskiem "Generuj".
- **Obsługiwana walidacja**: Walidacja odbywa się po stronie klienta za pomocą Zod.
  - `source_text`: Minimalnie 1 znak, maksymalnie 1000 znaków.
  - `count`: Wartość liczbowa pomiędzy 10 a 30.
- **Typy**: `CreateGenerationViewModel`.
- **Propsy**: Brak.

## 5. Typy

- **`CreateGenerationCommand`**: Istniejący typ z `src/types.ts`, używany jako argument dla Server Action i serwisu `generationService`.
- **`CreateGenerationViewModel` (ViewModel)**: Nowy typ i schemat Zod dla formularza, zapewniający walidację po stronie klienta.

  ```typescript
  import { z } from 'zod'

  export const CreateGenerationSchema = z.object({
    source_text: z
      .string()
      .min(1, 'Tekst źródłowy jest wymagany.')
      .max(1000, 'Tekst źródłowy nie może przekraczać 1000 znaków.'),
    // Suwak Shadcn/ui zwraca tablicę, więc musimy ją przetransformować
    count: z
      .array(z.number())
      .transform((arr) => arr[0])
      .refine((val) => val >= 10 && val <= 30),
  })

  export type CreateGenerationViewModel = z.infer<typeof CreateGenerationSchema>
  ```

## 6. Zarządzanie stanem

- **Stan formularza**: W całości zarządzany przez `react-hook-form` w komponencie `GeneratorForm`. Hook `useForm` zostanie zainicjowany z `CreateGenerationSchema` jako resolverem.
- **Stan ładowania**: Do obsługi asynchronicznej natury Server Action zostanie użyty hook `useTransition`. Zmienna `isPending` z tego hooka będzie sterować stanem ładowania przycisku "Generuj", blokując go i wyświetlając spinner, co realizuje wymóg "paska postępu" z historyjki użytkownika.

## 7. Integracja API

Integracja z backendem zostanie zrealizowana za pomocą **Next.js Server Action**, co eliminuje potrzebę tworzenia tradycyjnego endpointu API po stronie klienta.

- **Akcja Serwerowa**: `generateFlashcards`
- **Lokalizacja**: `src/app/generator/actions.ts` (sugerowana lokalizacja)
- **Logika**:
  1. Akcja przyjmuje dane formularza (`CreateGenerationCommand`).
  2. Waliduje dane po stronie serwera przy użyciu `CreateGenerationSchema`.
  3. Wywołuje `generationService.create(data)`, który obsługuje logikę komunikacji z AI i zapisu do bazy danych.
  4. W przypadku sukcesu zwraca `{ success: true }`.
  5. W przypadku błędu (np. błąd usługi AI, błąd bazy danych), łapie wyjątek i zwraca `{ success: false, error: 'Wystąpił błąd podczas generowania fiszek.' }`.
- **Typy żądania i odpowiedzi**:
  - **Żądanie (argumenty akcji)**: `CreateGenerationCommand`
  - **Odpowiedź**: `Promise<{ success: boolean; error?: string }>`

## 8. Interakcje użytkownika

- **Wypełnianie formularza**: Użytkownik wprowadza tekst i wybiera liczbę fiszek. Interfejs reaguje na zmiany, a walidacja uruchamia się przy próbie wysłania formularza.
- **Wysyłanie formularza**:
  - Po kliknięciu "Generuj", przycisk zostaje zablokowany, a na nim pojawia się ikona ładowania (`isPending` z `useTransition`).
  - Wywoływana jest Server Action `generateFlashcards`.
- **Wynik operacji**:
  - **Sukces**: Komponent `GeneratorForm` otrzymuje pomyślną odpowiedź i wywołuje `router.push('/?view=pending')`, aby przekierować użytkownika na listę fiszek do zatwierdzenia.
  - **Błąd**: Komponent otrzymuje odpowiedź z błędem i wyświetla powiadomienie "toast" (np. używając `sonner`) z komunikatem o błędzie.

## 9. Warunki i walidacja

- **Długość tekstu**: Weryfikowana na kliencie (`max: 1000`) i serwerze.
- **Liczba fiszek**: Weryfikowana na kliencie (zakres 10-30) i serwerze.
- **Wymagane pola**: Oba pola są wymagane, co jest walidowane na obu warstwach.

## 10. Obsługa błędów

- **Błędy walidacji klienta**: Obsługiwane przez `react-hook-form` i Zod. Komunikaty wyświetlane są bezpośrednio pod polami formularza.
- **Błędy serwera (np. błąd AI, błąd DB)**: Server Action zwraca obiekt z polem `error`. `GeneratorForm` przechwytuje go i informuje użytkownika za pomocą powiadomienia "toast".
- **Puste pola**: Walidacja Zod (`.min(1)`) zapobiega wysłaniu pustego formularza.

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Stwórz plik `src/app/generator/page.tsx` (`GeneratorPage`).
   - Stwórz plik `src/components/generator/generator-form.tsx` (`GeneratorForm`).
   - Zaktualizuj `src/lib/validators.ts` o `CreateGenerationSchema` i typ `CreateGenerationViewModel`.
2. **Implementacja `GeneratorPage`**:
   - Utwórz prosty komponent serwerowy, który renderuje `<GeneratorForm />` wewnątrz wyśrodkowanego kontenera.
3. **Implementacja `GeneratorForm`**:
   - Oznacz komponent jako `"use client"`.
   - Zbuduj UI formularza używając komponentów Shadcn/ui (`Card`, `Form`, `Textarea`, `Slider`, `Button`).
   - Skonfiguruj `useForm` z `CreateGenerationSchema`.
   - Zaimplementuj logikę `onSubmit` i połącz ją z `useTransition`.
4. **Utworzenie Server Action**:
   - Stwórz plik `src/app/generator/actions.ts`.
   - Zaimplementuj funkcję `generateFlashcards` (`'use server'`), która waliduje dane i wywołuje `generationService`.
5. **Połączenie Formularza z Akcją**:
   - W funkcji `onSubmit` w `GeneratorForm` wywołaj akcję `generateFlashcards`.
   - Zaimplementuj obsługę odpowiedzi: przekierowanie w przypadku sukcesu, wyświetlenie toasta w przypadku błędu.
6. **Finalizacja i UX**:
   - Upewnij się, że stan ładowania na przycisku działa poprawnie.
   - Dodaj czytelne etykiety i opisy do pól formularza, w tym dynamiczne wyświetlanie wartości suwaka.
