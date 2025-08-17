# Plan implementacji widoku Głównego - Lista Fiszek

## 1. Przegląd

Główny widok, dostępny pod adresem `/`, stanowi centrum nawigacyjne aplikacji. Jego zadaniem jest wyświetlanie listy fiszek należących do zalogowanego użytkownika, umożliwiając ich filtrowanie, zarządzanie i przechodzenie do trybu nauki. Stan widoku (aktywna zakładka, filtry, paginacja) jest w pełni kontrolowany przez parametry URL, co zapewnia spójność i doskonałe wrażenia użytkownika. Architektura opiera się na Komponentach Serwerowych Next.js do pobierania danych i Akcjach Serwerowych do ich modyfikacji, co minimalizuje ilość kodu po stronie klienta.

## 2. Routing widoku

- **Ścieżka widoku**: `/`
- **Ochrona**: Widok musi być chroniony przez `middleware`, które przekieruje niezalogowanych użytkowników na stronę `/login`.
- **Parametry URL**: Stan widoku jest zarządzany przez następujące parametry wyszukiwania:
  - `view`: Określa typ wyświetlanych fiszek.
    - `approved` (domyślny): Wyświetla zaakceptowane fiszki.
    - `pending`: Wyświetla fiszki wygenerowane przez AI, oczekujące na zatwierdzenie.
  - `source`: Filtruje fiszki na podstawie ich pochodzenia (działa tylko dla `view=approved`).
    - `all` (domyślny): Wszystkie fiszki.
    - `ai`: Tylko fiszki od AI.
    - `manual`: Tylko fiszki dodane ręcznie.
  - `page`: Numer strony dla paginacji (np. `1`, `2`, ...). Domyślnie `1`.

## 3. Struktura komponentów

Hierarchia komponentów została zaprojektowana z myślą o separacji odpowiedzialności i wykorzystaniu architektury Next.js App Router.

```
/ (FlashcardsPage - Komponent Serwerowy)
└── <Suspense fallback={<FlashcardListSkeleton />}>
    ├── AppHeader (Komponent Kliencki)
    ├── FlashcardListControls (Komponent Kliencki)
    │   ├── ToggleGroup (view: "Zatwierdzone" / "Do zatwierdzenia")
    │   └── DropdownMenu (source: "Wszystkie" / "AI" / "Manualne")
    ├── FlashcardList (Komponent Kliencki)
    │   └── Flashcard (Komponent Kliencki) [mapowany]
    │       ├── Card (wyświetlanie przodu/tyłu)
    │       └── FlashcardActions (przyciski Akceptuj, Odrzuć, Edytuj, Usuń)
    └── PaginationControls (Komponent Kliencki)
```

## 4. Szczegóły komponentów

### `FlashcardsPage` (Komponent Serwerowy)

- **Opis**: Główny komponent strony. Odczytuje parametry z `searchParams`, waliduje je, a następnie wywołuje serwis `flashcardService` w celu pobrania odpowiednich danych (fiszek i całkowitej ich liczby). Przekazuje dane do komponentów klienckich.
- **Główne elementy**: `<AppHeader>`, `<FlashcardListControls>`, `<FlashcardList>`, `<PaginationControls>`. Używa `<Suspense>` do obsługi stanu ładowania.
- **Propsy**: `searchParams: { [key: string]: string | string[] | undefined }`.

### `FlashcardListControls` (Komponent Kliencki)

- **Opis**: Zarządza interfejsem filtrowania. Odczytuje aktualne parametry (`view`, `source`) z URL za pomocą `useSearchParams` i renderuje odpowiedni stan kontrolek. Zmiana wartości w kontrolkach powoduje aktualizację URL za pomocą `useRouter`.
- **Główne elementy**: `<ToggleGroup>` (Shadcn), `<DropdownMenu>` (Shadcn).
- **Obsługiwane interakcje**: Zmiana aktywnego widoku (`ToggleGroup`), zmiana aktywnego filtra źródła (`DropdownMenu`).
- **Propsy**: `initialView: 'approved' | 'pending'`, `initialSource: 'all' | 'ai' | 'manual'`.

### `FlashcardList` (Komponent Kliencki)

- **Opis**: Renderuje siatkę fiszek. Otrzymuje listę fiszek jako props. Wyświetla komunikat o braku fiszek, jeśli lista jest pusta.
- **Główne elementy**: Pętla `map` renderująca komponenty `<Flashcard />`.
- **Propsy**: `flashcards: FlashcardDto[]`.

### `Flashcard` (Komponent Kliencki)

- **Opis**: Wyświetla pojedynczą fiszkę. Odpowiada za wizualne rozróżnienie źródła (fioletowa obwódka dla `AI`, pomarańczowa dla `MANUAL`). Warunkowo renderuje przyciski akcji w zależności od statusu fiszki. Obsługuje wywołania Akcji Serwerowych.
- **Główne elementy**: `<Card>` (Shadcn), przyciski akcji, `<AlertDialog>` (Shadcn) do potwierdzenia usunięcia.
- **Obsługiwane interakcje**: Kliknięcie przycisków "Akceptuj", "Odrzuć", "Edytuj", "Usuń".
- **Typy**: `FlashcardDto`.
- **Propsy**: `flashcard: FlashcardDto`.

### `PaginationControls` (Komponent Kliencki)

- **Opis**: Renderuje nawigację paginacji. Oblicza całkowitą liczbę stron i renderuje odpowiednie przyciski. Aktualizuje parametr `page` w URL.
- **Główne elementy**: `<Pagination>` (Shadcn).
- **Obsługiwane interakcje**: Kliknięcie przycisków nawigacji strony.
- **Propsy**: `totalCount: number`, `currentPage: number`, `perPage: number`.

## 5. Typy

- **`FlashcardDto`**: Główny obiekt transferu danych z `src/types.ts`, reprezentujący pojedynczą fiszkę pobraną z bazy danych. Będzie używany jako główny typ w propsach komponentów.
- **`FlashcardSearchParams` (ViewModel)**: Nowy typ do reprezentowania zwalidowanych parametrów URL po stronie serwera.
  ```typescript
  export interface FlashcardSearchParams {
    view: 'approved' | 'pending'
    source: 'ai' | 'manual' | 'all'
    page: number
    limit: number
  }
  ```

## 6. Zarządzanie stanem

- **Źródło prawdy**: Stan aplikacji (filtry, strona) jest przechowywany w **parametrach URL**. Komponenty klienckie odczytują go za pomocą hooka `useSearchParams`.
- **Modyfikacja stanu**: Zmiany stanu są inicjowane przez interakcje użytkownika w komponentach klienckich (`FlashcardListControls`, `PaginationControls`), które aktualizują URL za pomocą `useRouter().push()`. Przekierowanie powoduje ponowne renderowanie komponentu serwerowego `FlashcardsPage` z nowymi danymi.
- **Mutacje danych**: Operacje takie jak akceptacja, odrzucenie czy usunięcie fiszki są obsługiwane przez **Akcje Serwerowe (Server Actions)**.
  - Akcje te są wywoływane z komponentu klienckiego `<Flashcard />`.
  - Po pomyślnym wykonaniu operacji w bazie danych, akcja wywołuje `revalidatePath('/')`, co unieważnia cache i powoduje ponowne pobranie danych przez `FlashcardsPage`, odświeżając UI.
  - Hook `useTransition` będzie używany do zarządzania stanem oczekiwania podczas wywoływania akcji.

## 7. Integracja API

Interfejs będzie komunikował się z backendem na dwa sposoby: poprzez bezpośrednie wywołania serwisu po stronie serwera oraz poprzez Akcje Serwerowe.

- **Pobieranie danych (Server-Side)**:
  - Komponent `FlashcardsPage` będzie importował i bezpośrednio wywoływał funkcję z `src/services/flashcardService.ts` do pobierania listy fiszek, przekazując do niej zwalidowane parametry (`status`, `source`, `limit`, `offset`).
- **Modyfikacja danych (Server Actions)**:
  - **Akceptacja fiszki**:
    - Akcja: `approveFlashcard(flashcardId: number)`
    - Logika: Wywołuje `flashcardService.update(flashcardId, { status: 'approved' })`.
    - Odpowiedź: `{ success: true }` lub `{ success: false, error: string }`.
  - **Usunięcie/Odrzucenie fiszki**:
    - Akcja: `deleteFlashcard(flashcardId: number)`
    - Logika: Wywołuje `flashcardService.remove(flashcardId)`.
    - Odpowiedź: `{ success: true }` lub `{ success: false, error: string }`.
  - Wszystkie akcje po sukcesie muszą wywołać `revalidatePath('/')`.

## 8. Interakcje użytkownika

- **Zmiana widoku "Zatwierdzone" / "Do zatwierdzenia"**: Użytkownik klika na przełącznik. URL jest aktualizowany, co powoduje przeładowanie listy fiszek.
- **Filtrowanie listy**: Użytkownik wybiera opcję z dropdowna. URL jest aktualizowany, lista jest przeładowywana z nowym filtrem.
- **Zmiana strony**: Użytkownik klika na przycisk paginacji. Parametr `page` w URL jest aktualizowany, ładowana jest nowa strona fiszek.
- **Akceptacja fiszki**: Użytkownik klika "Akceptuj". Akcja serwerowa jest wywoływana, fiszka znika z widoku "Do zatwierdzenia", a UI jest odświeżane. Pojawia się toast o sukcesie.
- **Usuwanie/Odrzucanie fiszki**: Użytkownik klika "Usuń" lub "Odrzuć". Pojawia się modal z prośbą o potwierdzenie. Po potwierdzeniu, akcja serwerowa jest wywoływana, fiszka znika z listy, a UI jest odświeżane. Pojawia się toast o sukcesie.

## 9. Warunki i walidacja

- **Walidacja parametrów URL**: Po stronie serwera, w `FlashcardsPage`, parametry `view`, `source` i `page` są odczytywane i walidowane. W przypadku nieprawidłowych lub brakujących wartości, stosowane są bezpieczne wartości domyślne (np. `view = 'approved'`, `page = 1`).
- **Uprawnienia**: Logika autoryzacji (sprawdzanie, czy użytkownik jest właścicielem fiszki) jest w całości obsługiwana na poziomie bazy danych przez polityki RLS (Row-Level Security) Supabase. Frontend nie musi implementować tej logiki.

## 10. Obsługa błędów

- **Błąd pobierania danych**: Jeśli `flashcardService` rzuci błąd w `FlashcardsPage`, komponent powinien przechwycić go w bloku `try...catch` i wyświetlić komunikat o błędzie zamiast listy fiszek.
- **Błąd akcji serwerowej**: Każda akcja serwerowa zwraca obiekt z polem `error` w przypadku niepowodzenia. Komponent kliencki, który ją wywołał, sprawdza odpowiedź i w razie błędu wyświetla powiadomienie "toast" z odpowiednią informacją (np. "Nie udało się usunąć fiszki. Spróbuj ponownie.").
- **Stan pusty**: Jeśli zapytanie do bazy danych zwróci pustą tablicę, komponent `FlashcardList` powinien wyświetlić przyjazny dla użytkownika komunikat, np. "Nie znaleziono żadnych fiszek. Wygeneruj nowe lub dodaj je ręcznie!".

## 11. Kroki implementacji

1. **Struktura strony**: Utwórz plik `src/app/page.tsx` (`FlashcardsPage`). Zaimplementuj logikę odczytu i walidacji `searchParams` oraz pobieranie danych z serwisu.
2. **Layout i Kontrolki**: Stwórz komponenty `AppHeader` i `FlashcardListControls`. Zaimplementuj logikę aktualizacji URL na podstawie interakcji użytkownika.
3. **Lista i Skeleton**: Stwórz komponenty `FlashcardList` i `FlashcardListSkeleton`. Połącz `FlashcardsPage` z `FlashcardList` przekazując pobrane dane. Zintegruj `Suspense`.
4. **Komponent Fiszki**: Stwórz komponent `Flashcard`, który renderuje pojedynczą fiszkę i warunkowo wyświetla przyciski.
5. **Akcje Serwerowe**: W nowym pliku (np. `src/app/flashcards/actions.ts`) zdefiniuj akcje `approveFlashcard` i `deleteFlashcard`.
6. **Integracja Akcji**: W komponencie `Flashcard` zaimplementuj logikę wywoływania akcji serwerowych, w tym obsługę stanu `pending` z `useTransition` oraz wyświetlanie modalu potwierdzającego usunięcie.
7. **Paginacja**: Stwórz komponent `PaginationControls` i zintegruj go z `FlashcardsPage`, przekazując `totalCount` i `currentPage`.
8. **Obsługa Błędów i Stanów Pustych**: Zaimplementuj wyświetlanie komunikatów o błędach i pustych listach.
9. **Stylowanie**: Dopracuj wygląd wszystkich komponentów zgodnie z UI planem, w tym kolorowe obwódki dla fiszek.
