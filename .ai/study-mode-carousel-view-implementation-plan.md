# Plan implementacji widoku: Tryb Nauki (Karuzela)

## 1. Przegląd

Widok "Tryb Nauki" to pełnoekranowy modal (dialog), który pozwala użytkownikom na skoncentrowane przeglądanie i naukę zatwierdzonych fiszek. Wykorzystuje interfejs karuzeli do nawigacji między fiszkami, które można obracać, aby zobaczyć ich drugą stronę. Celem jest zapewnienie płynnego i wolnego od rozpraszaczy środowiska do nauki.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/study`. Będzie on akceptował następujące parametry zapytania (query params) w celu konfiguracji sesji nauki:

- `source` (opcjonalny): Filtruje fiszki według źródła. Dopuszczalne wartości: `ai`, `manual`, `all` (domyślna).
- `start_id` (opcjonalny): Określa ID fiszki, od której ma się rozpocząć sesja. Jeśli nie zostanie podany, sesja rozpocznie się od pierwszej fiszki z pobranej listy.

Przykład: `/study?source=ai&start_id=42`

## 3. Struktura komponentów

Hierarchia komponentów będzie wyglądać następująco. Komponenty z `(shadcn)` oznaczają wykorzystanie gotowych rozwiązań z biblioteki `shadcn/ui`.

```
StudyModePage (strona /study)
└── StudyModeDialog (shadcn/Dialog)
    ├── ProgressIndicator (np. "Fiszka 5 z 50")
    ├── FlashcardCarousel (shadcn/Carousel)
    │   ├── CarouselContent
    │   │   └── (mapowanie po liście fiszek)
    │   │       └── CarouselItem
    │   │           └── FlippableCard
    │   │               ├── CardFront
    │   │               └── CardBack
    │   ├── CarouselPrevious (shadcn/Button)
    │   └── CarouselNext (shadcn/Button)
    └── CloseButton (shadcn/Button)
```

## 4. Szczegóły komponentów

### `StudyModePage`

- **Opis komponentu**: Główny komponent strony renderowany dla ścieżki `/study`. Odpowiada za odczytanie parametrów z URL, uruchomienie procesu pobierania danych i zarządzanie stanami ładowania, błędu oraz pustego widoku. Renderuje `StudyModeDialog` z pobranymi fiszkami.
- **Główne elementy**: Komponent serwerowy (RSC) lub kliencki, który używa hooka `useSearchParams` do odczytu parametrów URL. Renderuje `StudyModeDialog` warunkowo, w zależności od stanu ładowania danych.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji.
- **Obsługiwana walidacja**: Weryfikuje parametry `source` i `start_id` z URL.
- **Typy**: `FlashcardDto[]`
- **Propsy**: Brak.

### `StudyModeDialog`

- **Opis komponentu**: Pełnoekranowy modal oparty na `Dialog` z `shadcn/ui`. Zawiera cały interfejs użytkownika do nauki, w tym karuzelę, wskaźnik postępu i przycisk zamknięcia.
- **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`. Wewnątrz `DialogContent` renderowany jest `FlashcardCarousel`.
- **Obsługiwane interakcje**: Zamknięcie modala (poprzez przycisk lub klawisz `Esc`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardDto`
- **Propsy**:
  - `flashcards: FlashcardDto[]`: Tablica fiszek do wyświetlenia.
  - `startId?: number`: ID fiszki, od której należy rozpocząć.
  - `isOpen: boolean`: Stan otwarcia dialogu.
  - `onOpenChange: (isOpen: boolean) => void`: Funkcja zwrotna do obsługi zamknięcia dialogu (np. przez nawigację wstecz).

### `FlashcardCarousel`

- **Opis komponentu**: Komponent oparty na `Carousel` z `shadcn/ui`, który zarządza nawigacją między fiszkami. Wyświetla przyciski "następny"/"poprzedni" oraz wskaźnik postępu.
- **Główne elementy**: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`. W pętli renderuje komponenty `FlippableCard` dla każdej fiszki.
- **Obsługiwane interakcje**: Przewijanie fiszek (przyciski, gesty swipe, strzałki na klawiaturze).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardDto`
- **Propsy**:
  - `flashcards: FlashcardDto[]`: Tablica fiszek.
  - `startIndex: number`: Indeks początkowej fiszki.

### `FlippableCard`

- **Opis komponentu**: Interaktywna karta wyświetlająca pojedynczą fiszkę. Posiada wewnętrzny stan do zarządzania obrotem. Kliknięcie na kartę powoduje płynną animację obrotu o 180 stopni, aby pokazać drugą stronę.
- **Główne elementy**: Kontener `div` z odpowiednimi stylami CSS do animacji 3D. Dwa elementy `div` wewnątrz (dla przodu i tyłu karty), oparte na komponencie `Card` z `shadcn/ui`.
- **Obsługiwane interakcje**: Kliknięcie myszą lub dotknięcie w celu obrócenia. Obsługa klawiszy `Spacja`/`Enter` do obrócenia karty.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardDto`
- **Propsy**:
  - `flashcard: FlashcardDto`: Obiekt z danymi pojedynczej fiszki.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy. Nie ma potrzeby tworzenia nowych.

- **`FlashcardDto`**: Główny typ danych transferowych (DTO) reprezentujący fiszkę pobraną z API. Zdefiniowany w `src/types.ts`.
  ```typescript
  // src/types.ts
  export type FlashcardDto = Tables<'flashcards'>
  /*
  {
    id: number;
    user_id: string;
    front: string;
    back: string;
    status: 'approved' | 'waiting_for_approval';
    source: 'AI' | 'MANUAL';
    ...
  }
  */
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie w większości lokalne dla komponentów.

- **`StudyModePage`**: Użyje hooka `useState` do przechowywania stanu ładowania (`isLoading`), błędu (`error`) oraz pobranych danych (`flashcards: FlashcardDto[]`). Logika pobierania danych może zostać zamknięta w dedykowanym customowym hooku `useStudySession`.
- **`FlashcardCarousel`**: `shadcn/ui` `Carousel` (oparty na `embla-carousel-react`) zarządza swoim wewnętrznym stanem. Będziemy potrzebować dodatkowego stanu `useState` do śledzenia aktualnego indeksu slajdu (`currentIndex`), aby zaktualizować wskaźnik postępu. Stan ten będzie synchronizowany za pomocą API karuzeli (np. `api.on('select', ...)`).
- **`FlippableCard`**: Każda karta będzie miała swój własny, niezależny stan `isFlipped: boolean` zarządzany przez `useState`, aby kontrolować jej obrót.

## 7. Integracja API

Komponent `StudyModePage` (lub hook `useStudySession`) będzie odpowiedzialny za komunikację z API.

- **Endpoint**: `GET /api/flashcards`
- **Metoda**: `GET`
- **Parametry zapytania**:
  - `status=approved` (stały, ponieważ w trybie nauki widzimy tylko zatwierdzone fiszki).
  - `source` (opcjonalny): Wartość z parametru URL (`ai`, `manual` lub pominięty dla `all`).
  - `limit=1000` (w celu pobrania wszystkich fiszek w jednym zapytaniu, jako uproszczenie dla MVP).
- **Typ odpowiedzi ( sukces)**: `FlashcardDto[]`
- **Typ odpowiedzi (błąd)**: Standardowy obiekt błędu.

## 8. Interakcje użytkownika

- **Nawigacja**: Użytkownik klika przyciski ">" / "<", używa strzałek na klawiaturze lub przesuwa palcem (swipe) na urządzeniach dotykowych, aby przejść do następnej/poprzedniej fiszki.
- **Obracanie fiszki**: Użytkownik klika na kartę lub naciska klawisze `Spacja`/`Enter`, aby ją obrócić i zobaczyć drugą stronę. Stan obrotu jest resetowany przy przejściu do innej fiszki.
- **Zamykanie widoku**: Użytkownik klika przycisk "X" lub naciska klawisz `Esc`, co powoduje zamknięcie modala i powrót do poprzedniego widoku.

## 9. Warunki i walidacja

- **Na poziomie `StudyModePage`**:
  - Przed wykonaniem zapytania do API, komponent musi sprawdzić, czy użytkownik jest zalogowany.
  - Parametr `source` z URL jest walidowany – jeśli jest nieprawidłowy, przyjmowana jest wartość domyślna (`all`).
- **Renderowanie warunkowe**:
  - Podczas pobierania danych wyświetlany jest wskaźnik ładowania (np. `Skeleton` z `shadcn/ui`).
  - Jeśli API zwróci błąd, wyświetlany jest komunikat o błędzie.
  - Jeśli API zwróci pustą tablicę, wyświetlany jest komunikat "Brak fiszek do nauki w tej kategorii".

## 10. Obsługa błędów

- **Błąd pobierania danych**: Jeśli zapytanie do `GET /api/flashcards` zakończy się niepowodzeniem, w komponencie `StudyModeDialog` zostanie wyświetlony czytelny komunikat błędu z prośbą o spróbowanie ponownie później.
- **Brak fiszek**: Jeśli odpowiedź z API to pusta tablica, użytkownik zobaczy informację zachęcającą do dodania lub wygenerowania nowych fiszek.
- **Nieprawidłowy `start_id`**: Jeśli `start_id` podany w URL nie zostanie znaleziony w pobranej liście fiszek, karuzela rozpocznie się od pierwszej fiszki (indeks 0).

## 11. Kroki implementacji

1.  **Stworzenie strony**: Utworzenie nowej strony w `app/study/page.tsx`. Będzie to komponent serwerowy lub kliencki, który będzie zarządzał pobieraniem danych.
2.  **Logika pobierania danych**: Implementacja logiki (np. w customowym hooku `useStudySession`) do pobierania zatwierdzonych fiszek z `GET /api/flashcards` na podstawie parametrów URL (`source`). Obsługa stanów ładowania i błędów.
3.  **Komponent `FlippableCard`**: Stworzenie komponentu `FlippableCard` wraz ze stylami CSS (Tailwind) do animacji obrotu 3D. Komponent będzie przyjmował `flashcard: FlashcardDto` jako prop.
4.  **Komponent `StudyModeDialog`**: Stworzenie komponentu `StudyModeDialog`, który będzie używał `Dialog` z `shadcn/ui` w trybie pełnoekranowym.
5.  **Integracja karuzeli**: Wewnątrz `StudyModeDialog`, dodanie i skonfigurowanie komponentu `Carousel` z `shadcn/ui`.
6.  **Renderowanie fiszek**: Wewnątrz karuzeli, zmapowanie pobranych danych `FlashcardDto[]` i wyrenderowanie komponentów `FlippableCard` dla każdej fiszki.
7.  **Wskaźnik postępu**: Dodanie logiki do śledzenia aktualnego slajdu karuzeli i wyświetlanie wskaźnika postępu (np. "Fiszka 5 z 50").
8.  **Obsługa `start_id`**: Implementacja logiki, która na podstawie `start_id` z URL znajduje odpowiedni indeks startowy dla karuzeli.
9.  **Dostępność**: Dodanie obsługi nawigacji za pomocą klawiatury (strzałki dla karuzeli, `Spacja`/`Enter` do obracania karty, `Esc` do zamknięcia dialogu).
10. **Testowanie**: Przetestowanie wszystkich interakcji, obsługi błędów i responsywności na różnych urządzeniach.
