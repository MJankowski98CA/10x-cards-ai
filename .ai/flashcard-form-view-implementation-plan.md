# Plan implementacji widoku Formularz Manualny / Edycji Fiszki

## 1. Przegląd

Widok ten pełni podwójną rolę: umożliwia ręczne tworzenie nowych fiszek oraz edycję już istniejących, niezależnie od ich pochodzenia (manualne czy AI). Jest to kluczowy element aplikacji, zapewniający użytkownikom pełną kontrolę nad ich materiałami do nauki. Architektura opiera się na jednym, reużywalnym komponencie formularza, który dynamicznie dostosowuje swoje działanie w zależności od kontekstu (tworzenie lub edycja). Po pomyślnym zapisaniu zmian użytkownik jest płynnie przekierowywany z powrotem do głównej listy fiszek.

## 2. Routing widoku

Aplikacja będzie obsługiwać dwie oddzielne, chronione ścieżki, które będą renderować ten sam komponent formularza w różnych trybach:

- **Tworzenie nowej fiszki**: `/flashcards/new`
- **Edycja istniejącej fiszki**: `/flashcards/[id]/edit` (gdzie `[id]` to dynamiczny parametr odpowiadający ID fiszki)

Obie ścieżki muszą być chronione przez `middleware`.

## 3. Struktura komponentów

Hierarchia komponentów jest zaprojektowana w celu maksymalizacji reużywalności i wykorzystania architektury serwerowej Next.js do pobierania danych.

```
- /flashcards/new (Route)
  └── NewFlashcardPage (Komponent Serwerowy)
      └── FlashcardForm (Komponent Kliencki, tryb: 'create')

- /flashcards/[id]/edit (Route)
  └── EditFlashcardPage (Komponent Serwerowy)
      - Pobiera dane fiszki o danym [id]
      └── FlashcardForm (Komponent Kliencki, tryb: 'edit', initialData={...})

// Reużywalny komponent formularza
FlashcardForm (Komponent Kliencki)
├── Form (Wrapper z react-hook-form/Shadcn)
│   ├── Card
│   │   ├── CardHeader (Tytuł dynamiczny: "Nowa fiszka" / "Edytuj fiszkę")
│   │   ├── CardContent
│   │   │   ├── FormField (dla "front") -> Textarea
│   │   │   └── FormField (dla "back") -> Textarea
│   │   └── CardFooter
│   │       └── Button[type=submit] (dynamiczny tekst: "Utwórz" / "Zapisz zmiany")
```

## 4. Szczegóły komponentów

### `NewFlashcardPage` (Komponent Serwerowy)

- **Opis**: Renderuje formularz w trybie tworzenia. Jego jedynym zadaniem jest wywołanie komponentu `<FlashcardForm />` bez przekazywania danych początkowych.
- **Główne elementy**: `<FlashcardForm />`.

### `EditFlashcardPage` (Komponent Serwerowy)

- **Opis**: Renderuje formularz w trybie edycji. Pobiera dane konkretnej fiszki za pomocą `flashcardService.findById(id)`, a następnie przekazuje je jako `initialData` do `<FlashcardForm />`. Obsługuje błąd, gdy fiszka nie zostanie znaleziona (np. przez `notFound()` z Next.js).
- **Główne elementy**: `<FlashcardForm />`.
- **Propsy**: `params: { id: string }`.

### `FlashcardForm` (Komponent Kliencki)

- **Opis**: Reużywalny, kliencki (`"use client"`) komponent formularza. Zarządza stanem, walidacją i logiką wysyłania danych. Rozpoznaje tryb pracy na podstawie obecności propsa `initialData`.
- **Główne elementy**: `<Card>`, `<Form>`, `<Textarea>`, `<Button>` z biblioteki Shadcn/ui.
- **Obsługiwane interakcje**: Wprowadzanie tekstu w polach `front` i `back`, wysłanie formularza przyciskiem.
- **Obsługiwana walidacja**: Pola `front` i `back` nie mogą być puste i mają limit 1000 znaków.
- **Typy**: `FlashcardFormViewModel`, `FlashcardDto`.
- **Propsy**: `initialData?: FlashcardDto`.

## 5. Typy

- **`FlashcardDto`**: Istniejący typ z `src/types.ts`, używany do przekazywania danych początkowych w trybie edycji.
- **`FlashcardFormViewModel` (ViewModel)**: Nowy schemat Zod i typ dla danych formularza.

  ```typescript
  import { z } from 'zod'

  export const FlashcardFormSchema = z.object({
    front: z
      .string()
      .min(1, 'Pole "Przód" jest wymagane.')
      .max(1000, 'Tekst nie może przekraczać 1000 znaków.'),
    back: z
      .string()
      .min(1, 'Pole "Tył" jest wymagane.')
      .max(1000, 'Tekst nie może przekraczać 1000 znaków.'),
  })

  export type FlashcardFormViewModel = z.infer<typeof FlashcardFormSchema>
  ```

## 6. Zarządzanie stanem

- **Stan formularza**: Zarządzany lokalnie w `<FlashcardForm />` przez `react-hook-form`, z `FlashcardFormSchema` jako resolverem Zod.
- **Stan ładowania**: Obsługiwany przez hook `useTransition`. Zmienna `isPending` będzie kontrolować stan przycisku zapisu, blokując go i wyświetlając wskaźnik ładowania podczas komunikacji z serwerem.

## 7. Integracja API

Interakcja z backendem będzie realizowana za pomocą dwóch dedykowanych **Akcji Serwerowych (Server Actions)**.

- **Tworzenie fiszki**:
  - **Akcja**: `createFlashcard(data: FlashcardFormViewModel)`
  - **Logika**: Wywołuje `flashcardService.create(data)`. Po sukcesie unieważnia cache dla ścieżki `/` i przekierowuje użytkownika do `/`.
  - **Typ żądania**: `FlashcardFormViewModel` (odpowiada `CreateFlashcardCommand`).
  - **Odpowiedź**: `Promise<{ success: boolean; error?: string }>`
- **Aktualizacja fiszki**:
  - **Akcja**: `updateFlashcard(id: number, originalData: FlashcardDto, formData: FlashcardFormViewModel)`
  - **Logika**:
    1.  Konstruuje payload typu `UpdateFlashcardCommand`.
    2.  Implementuje kluczową logikę biznesową: jeśli `originalData.status` to `'waiting_for_approval'`, do payloadu dodawane jest `status: 'approved'`.
    3.  Wywołuje `flashcardService.update(id, payload)`.
    4.  Po sukcesie unieważnia cache dla `/` i przekierowuje do `/`.
  - **Typ żądania**: `id`, `originalData`, `formData`.
  - **Odpowiedź**: `Promise<{ success: boolean; error?: string }>`

## 8. Interakcje użytkownika

- **Nawigacja**: Użytkownik przechodzi do `/flashcards/new` (np. z nagłówka aplikacji) lub do `/flashcards/[id]/edit` (np. z listy fiszek).
- **Wypełnianie formularza**: Użytkownik wpisuje treść w polach `front` i `back`.
- **Wysyłanie formularza**: Użytkownik klika "Utwórz" lub "Zapisz zmiany". Przycisk jest blokowany i wyświetla stan ładowania. Odpowiednia akcja serwerowa jest wywoływana.
- **Rezultat**: Po pomyślnym zakończeniu akcji, użytkownik jest przekierowywany do listy fiszek (`/`), a na ekranie pojawia się powiadomienie "toast" o sukcesie. W razie błędu, również wyświetlany jest "toast".

## 9. Warunki i walidacja

- **Obecność treści**: Pola `front` i `back` muszą zawierać treść. Walidacja `min(1)` w schemacie Zod.
- **Długość treści**: Maksymalnie 1000 znaków na pole. Walidacja `max(1000)` w schemacie Zod.
- **Własność fiszki**: Weryfikacja po stronie serwera w `EditFlashcardPage` (oraz przez RLS w Supabase), czy zalogowany użytkownik jest właścicielem edytowanej fiszki.

## 10. Obsługa błędów

- **Brak fiszki (edycja)**: Komponent `EditFlashcardPage` przechwytuje błąd z `flashcardService` i powinien zwrócić stronę 404.
- **Błędy walidacji klienta**: Obsługiwane przez `react-hook-form` i Zod, z komunikatami pod polami.
- **Błędy akcji serwerowej**: Każda akcja zwraca obiekt `{ error }` w przypadku niepowodzenia. Komponent `FlashcardForm` wyświetla błąd w formie "toasta".

## 11. Kroki implementacji

1. **Struktura plików i routingu**:
   - Utwórz plik `src/app/flashcards/new/page.tsx` (`NewFlashcardPage`).
   - Utwórz strukturę `src/app/flashcards/[id]/edit/page.tsx` (`EditFlashcardPage`).
2. **Schemat walidacji**: Zdefiniuj `FlashcardFormSchema` i typ `FlashcardFormViewModel` w `src/lib/validators.ts`.
3. **Komponent formularza**:
   - Stwórz reużywalny komponent `src/components/flashcards/flashcard-form.tsx` (`FlashcardForm`).
   - Zaimplementuj UI przy użyciu Shadcn/ui.
   - Skonfiguruj `react-hook-form` z resolverem Zod.
   - Ustaw `defaultValues` na podstawie `initialData` (jeśli istnieje).
4. **Strony (Pages)**:
   - W `NewFlashcardPage` wyrenderuj `<FlashcardForm />`.
   - W `EditFlashcardPage` pobierz dane fiszki i przekaż je do `<FlashcardForm />`. Zaimplementuj obsługę błędu 404.
5. **Akcje Serwerowe**:
   - Stwórz plik `src/app/flashcards/actions.ts`.
   - Zaimplementuj akcje `createFlashcard` i `updateFlashcard` z całą wymaganą logiką biznesową.
6. **Integracja z akcjami**:
   - W `FlashcardForm` zaimplementuj funkcję `onSubmit`, która, używając `useTransition`, wywołuje odpowiednią akcję serwerową w zależności od trybu.
   - Dodaj obsługę odpowiedzi (przekierowanie, toasty).
7. **Finalizacja**: Upewnij się, że stany ładowania, komunikaty o błędach i sukcesie działają poprawnie, a nawigacja po zapisie jest płynna.
