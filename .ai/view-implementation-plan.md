# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za inicjowanie zadania generowania fiszek przez sztuczną inteligencję. Przyjmuje tekst źródłowy i liczbę fiszek do utworzenia, komunikuje się z zewnętrzną usługą AI, a następnie zapisuje wyniki w bazie danych. Po pomyślnym zakończeniu operacji, zwraca nowo utworzone zasoby.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generations`
- **Request Body**:
  ```json
  {
    "source_text": "string",
    "count": "number"
  }
  ```
- **Content-Type**: `application/json`

## 3. Wykorzystywane typy

- **Command Model (Request)**: `CreateGenerationCommand`
- **DTO (Response)**: `GenerationResponseDto`, zawierający `GenerationDto` i `GeneratedFlashcardDto[]`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**:
  ```json
  {
    "generation": {
      "id": 1,
      "user_id": "user-uuid-123",
      "model": "gpt-4o",
      "generated_count": 15,
      "source_text_length": 450,
      "created_at": "2023-10-27T10:00:00Z"
    },
    "flashcards": [
      {
        "id": 101,
        "generation_id": 1,
        "front": "Generated Question 1",
        "back": "Generated Answer 1",
        "status": "waiting_for_approval",
        "source": "AI",
        "is_edited": false
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Next.js Route Handler w `src/app/api/generations/route.ts` odbiera żądanie `POST`.
2.  **Uwierzytelnianie**: Sprawdzenie sesji użytkownika przy użyciu serwerowego klienta Supabase. W przypadku braku sesji, zwracany jest błąd `401`. `user_id` jest pobierany z sesji.
3.  **Walidacja**: Ciało żądania jest walidowane przy użyciu schemy Zod, która sprawdza typy, obecność i zakresy pól `source_text` i `count`. W przypadku błędu walidacji, zwracany jest błąd `400`.
4.  **Wywołanie serwisu**: Route Handler wywołuje metodę w `GenerationService`, przekazując zweryfikowane dane oraz `user_id`.
5.  **Logika biznesowa (w `GenerationService`)**:
    a. **Komunikacja z AI**: Serwis wysyła zapytanie do API Openrouter.ai, zawierające `source_text` i instrukcje dotyczące generowania fiszek. Klucz API jest pobierany ze zmiennych środowiskowych.
    b. **Przetwarzanie odpowiedzi AI**: Odpowiedź z AI jest parsowana i mapowana na listę obiektów fiszek (`{ front: string, back: string }`).
    c. **Transakcja bazodanowa**: Serwis rozpoczyna transakcję w bazie danych Supabase (PostgreSQL):
    i. **Zapis generacji**: Tworzony jest nowy rekord w tabeli `generations` z metadanymi, takimi jak `user_id`, `model`, `generated_count`, `source_text_length`, itp.
    ii. **Zapis fiszek**: Przy użyciu `id` nowo utworzonej generacji, hurtowo wstawiane są rekordy do tabeli `flashcards`. Każda fiszka otrzymuje `generation_id`, `status: 'waiting_for_approval'`, `source: 'AI'`.
    d. **Zatwierdzenie transakcji**: Jeśli oba zapisy powiodą się, transakcja jest zatwierdzana. W przeciwnym razie jest wycofywana.
6.  **Formatowanie odpowiedzi**: `GenerationService` zwraca nowo utworzone obiekty `generation` i `flashcards` do Route Handlera.
7.  **Wysłanie odpowiedzi**: Route Handler formatuje ostateczną odpowiedź DTO (`GenerationResponseDto`) i wysyła ją do klienta ze statusem `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Dostęp do endpointu będzie zablokowany bez ważnej sesji użytkownika.
- **Autoryzacja**: Polityki RLS w bazie danych zapewnią, że operacje zapisu są wykonywane wyłącznie w kontekście zalogowanego użytkownika.
- **Zarządzanie sekretami**: Klucz API do Openrouter.ai będzie przechowywany w zmiennych środowiskowych (`.env.local`) i dostępny wyłącznie po stronie serwera.
- **Rate Limiting**: Należy rozważyć implementację mechanizmu ograniczającego liczbę żądań na użytkownika (np. za pomocą Upstash lub podobnego rozwiązania), aby zapobiec nadużyciom i kontrolować koszty.

## 7. Obsługa błędów

- Błędy walidacji (400) będą zwracać szczegółowe komunikaty z biblioteki Zod.
- Błędy po stronie serwera (500), takie jak niedostępność usługi AI lub błąd bazy danych, będą logowane z odpowiednim kontekstem po stronie serwera, a klient otrzyma ogólny komunikat o błędzie.
- Wszelkie nieprzewidziane wyjątki zostaną przechwycone w bloku `try...catch` i potraktowane jako błąd `500`.

## 8. Rozważania dotyczące wydajności

- Czas odpowiedzi endpointu jest silnie uzależniony od czasu generowania odpowiedzi przez model AI. Proces ten jest z natury asynchroniczny i może trwać kilka-kilkanaście sekund.
- Operacja wstawiania fiszek do bazy danych będzie wykonana jako pojedyncza operacja hurtowa (`insert` na tablicy obiektów), aby zminimalizować liczbę zapytań do bazy.
- Należy rozważyć wdrożenie mechanizmu opartego na WebSockets lub long-polling dla zadań trwających dłużej, aby nie blokować klienta, jednak w pierwszej iteracji standardowe żądanie-odpowiedź jest akceptowalne.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku Route Handlera**: Stworzyć plik `src/app/api/generations/route.ts` z podstawową strukturą funkcji `POST`.
2.  **Implementacja uwierzytelniania**: Dodać logikę sprawdzającą sesję użytkownika na początku funkcji `POST` przy użyciu `@supabase/ssr`.
3.  **Definicja schemy walidacji**: Zdefiniować schemę Zod dla `CreateGenerationCommand` w osobnym pliku (`src/lib/validators.ts`) i zintegrować ją w handlerze.
4.  **Stworzenie szkieletu serwisu**: Utworzyć plik `src/services/generationService.ts` z klasą `GenerationService` i pustymi metodami.
5.  **Implementacja komunikacji z AI**: W `GenerationService` zaimplementować prywatną metodę do komunikacji z API Openrouter.ai, w tym obsługę błędów i parsowanie odpowiedzi.
6.  **Implementacja logiki bazodanowej**: Zaimplementować metodę odpowiedzialną za wykonanie transakcji: zapis rekordu `generations` i hurtowy zapis `flashcards`.
7.  **Połączenie logiki**: Zintegrować wywołania do AI i bazy danych w głównej metodzie publicznej serwisu.
8.  **Finalizacja Route Handlera**: Połączyć handler z serwisem, zaimplementować pełną obsługę błędów `try...catch` i formatowanie odpowiedzi DTO.
9.  **Konfiguracja zmiennych środowiskowych**: Dodać `OPENROUTER_API_KEY` do pliku `.env.local` i `.env.template`.
10. **Testowanie manualne**: Przetestować endpoint przy użyciu narzędzia do wysyłania żądań HTTP (np. Postman, Insomnia) dla scenariuszy sukcesu i błędów.

---

# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia pobieranie listy fiszek należących do uwierzytelnionego użytkownika. Wspiera on filtrowanie wyników na podstawie statusu, źródła pochodzenia oraz identyfikatora generacji, a także umożliwia paginację wyników.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards`
- **Query Parameters**:
  - **Opcjonalne**:
    - `status` (string): Filtruje po statusie. Dozwolone wartości: `approved`, `waiting_for_approval`.
    - `source` (string): Filtruje po źródle. Dozwolone wartości: `AI`, `MANUAL`.
    - `generation_id` (number): Filtruje po ID zadania generowania.
    - `limit` (number): Określa maksymalną liczbę zwracanych fiszek. Domyślnie `20`.
    - `offset` (number): Określa punkt początkowy pobierania danych. Domyślnie `0`.

## 3. Wykorzystywane typy

- **DTO (Response)**: `FlashcardDto[]` (każdy element jest typu `Tables<'flashcards'>`)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "user_id": "user-uuid-123",
      "generation_id": null,
      "front": "What is REST?",
      "back": "Representational State Transfer.",
      "status": "approved",
      "source": "MANUAL",
      "is_edited": false,
      "created_at": "2023-10-27T10:00:00Z",
      "updated_at": "2023-10-27T10:00:00Z"
    }
  ]
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Next.js Route Handler w `src/app/api/flashcards/route.ts` odbiera żądanie `GET`.
2.  **Uwierzytelnianie**: Sprawdzenie sesji użytkownika przy użyciu serwerowego klienta Supabase. W przypadku braku sesji, zwracany jest błąd `401`. `user_id` jest pobierany z sesji.
3.  **Walidacja**: Parametry zapytania (query params) są walidowane przy użyciu schemy Zod. W przypadku błędu walidacji (np. nieprawidłowa wartość `status`), zwracany jest błąd `400`.
4.  **Wywołanie serwisu**: Route Handler wywołuje metodę w nowym serwisie `FlashcardService`, przekazując `user_id` oraz zweryfikowane filtry i opcje paginacji.
5.  **Logika biznesowa (w `FlashcardService`)**:
    a. Metoda serwisu buduje dynamiczne zapytanie do Supabase.
    b. Zapytanie rozpoczyna się od `supabase.from('flashcards').select('*')`.
    c. Do zapytania dodawany jest warunek `.eq('user_id', userId)`, aby zapewnić separację danych (jako dodatkowa warstwa zabezpieczeń ponad RLS).
    d. Jeśli parametry filtrowania (`status`, `source`, `generation_id`) są obecne, do zapytania dodawane są odpowiednie warunki `.eq()`.
    e. Do zapytania dodawana jest paginacja za pomocą `.range(offset, offset + limit - 1)`.
    f. Zapytanie jest wykonywane.
6.  **Obsługa wyniku**: Serwis sprawdza, czy zapytanie do bazy danych zakończyło się sukcesem. Jeśli wystąpił błąd, jest on logowany i rzucany dalej, aby został obsłużony przez Route Handler.
7.  **Wysłanie odpowiedzi**: Serwis zwraca listę fiszek do Route Handlera, który wysyła ją do klienta ze statusem `200 OK`. Jeśli zapytanie się powiedzie, ale nie zwróci żadnych wyników, zwracana jest pusta tablica `[]`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest chroniony i wymaga aktywnej sesji użytkownika.
- **Autoryzacja**: Polityki RLS (Row-Level Security) na tabeli `flashcards` w bazie Supabase gwarantują, że użytkownicy mogą odczytywać wyłącznie własne fiszki. Dodatkowe filtrowanie po `user_id` w kodzie serwisu stanowi drugą warstwę zabezpieczeń.
- **Walidacja danych wejściowych**: Użycie biblioteki Zod do walidacji wszystkich parametrów wejściowych chroni przed nieoczekiwanymi danymi, które mogłyby prowadzić do błędów.
- **Bezpieczeństwo zapytań**: Korzystanie z klienta Supabase JS eliminuje ryzyko ataków typu SQL Injection.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy walidacja parametrów zapytania (np. `status`, `limit`) nie powiedzie się. Odpowiedź będzie zawierać szczegóły błędu walidacji.
- **401 Unauthorized**: Zwracany, gdy użytkownik próbuje uzyskać dostęp do zasobu bez aktywnej sesji.
- **500 Internal Server Error**: Zwracany w przypadku problemów z komunikacją z bazą danych lub innych nieoczekiwanych błędów po stronie serwera. Błąd zostanie zarejestrowany na serwerze, a klient otrzyma ogólną wiadomość.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie**: Należy upewnić się, że kolumny używane do filtrowania (`user_id`, `status`, `source`, `generation_id`) są odpowiednio zindeksowane w bazie danych PostgreSQL, aby zapewnić szybkie wykonywanie zapytań. Plan bazy danych (`db-plan.md`) już to przewiduje.
- **Paginacja**: Stosowanie paginacji (`limit`, `offset`) jest kluczowe dla wydajności, ponieważ zapobiega pobieraniu dużych zbiorów danych w jednym żądaniu.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku Route Handlera**: Stworzyć plik `src/app/api/flashcards/route.ts` z podstawową strukturą funkcji `GET`.
2.  **Implementacja uwierzytelniania**: Dodać logikę sprawdzającą sesję użytkownika na początku funkcji `GET`.
3.  **Definicja schemy walidacji**: W pliku `src/lib/validators.ts` dodać schemę Zod do walidacji query params (`status`, `source`, `generation_id`, `limit`, `offset`).
4.  **Stworzenie serwisu**: Utworzyć plik `src/services/flashcardService.ts` z klasą `FlashcardService` i metodą `getFlashcards(options)`.
5.  **Implementacja logiki bazodanowej**: W `FlashcardService` zaimplementować metodę, która dynamicznie buduje i wykonuje zapytanie do Supabase na podstawie przekazanych filtrów i opcji paginacji.
6.  **Finalizacja Route Handlera**: Połączyć handler z serwisem, zintegrować walidację Zod, zaimplementować pełną obsługę błędów `try...catch` i formatowanie odpowiedzi.
7.  **Testowanie manualne**: Przetestować endpoint przy użyciu narzędzia do wysyłania żądań HTTP, sprawdzając różne kombinacje filtrów, paginacji oraz scenariusze błędów.

---

# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za ręczne tworzenie nowej fiszki przez uwierzytelnionego użytkownika. Fiszki utworzone w ten sposób są automatycznie oznaczane jako zatwierdzone (`approved`) i pochodzące ze źródła ręcznego (`MANUAL`).

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/flashcards`
- **Request Body**:
  ```json
  {
    "front": "string",
    "back": "string"
  }
  ```
- **Content-Type**: `application/json`

## 3. Wykorzystywane typy

- **Command Model (Request)**: `CreateFlashcardCommand`
- **DTO (Response)**: `FlashcardDto`

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**:
  ```json
  {
    "id": 2,
    "user_id": "user-uuid-123",
    "generation_id": null,
    "front": "Manual Question",
    "back": "Manual Answer",
    "status": "approved",
    "source": "MANUAL",
    "is_edited": false,
    "created_at": "2023-10-27T11:00:00Z",
    "updated_at": "2023-10-27T11:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Funkcja `POST` w `src/app/api/flashcards/route.ts` odbiera żądanie.
2.  **Uwierzytelnianie**: Sprawdzana jest sesja użytkownika przy użyciu serwerowego klienta Supabase. W przypadku braku sesji, zwracany jest błąd `401`. `user_id` jest pobierany z aktywnej sesji.
3.  **Walidacja**: Ciało żądania jest walidowane przy użyciu schemy Zod dla `CreateFlashcardCommand`, która weryfikuje obecność i typ pól `front` i `back`. W przypadku błędu walidacji, zwracany jest błąd `400`.
4.  **Wywołanie serwisu**: Route Handler wywołuje metodę `createFlashcard` w `FlashcardService`, przekazując zweryfikowane dane z ciała żądania oraz `user_id`.
5.  **Logika biznesowa (w `FlashcardService`)**:
    a. Metoda `createFlashcard` przygotowuje obiekt do wstawienia do bazy danych.
    b. Obiekt zawiera `front` i `back` z komendy, `user_id` z sesji, oraz ustawia na stałe `status: 'approved'` i `source: 'MANUAL'`.
    c. Wykonywana jest operacja wstawienia nowego rekordu do tabeli `flashcards` za pomocą `supabase.from('flashcards').insert(...).select().single()`.
6.  **Obsługa wyniku**: Serwis sprawdza, czy operacja wstawienia do bazy danych powiodła się. W przypadku błędu, jest on logowany i rzucany dalej do obsługi w handlerze.
7.  **Wysłanie odpowiedzi**: Serwis zwraca nowo utworzony obiekt fiszki. Route Handler wysyła go do klienta z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie żądania do tego endpointu muszą być uwierzytelnione. Dostęp jest blokowany bez ważnej sesji użytkownika.
- **Autoryzacja**: Polityki RLS (Row-Level Security) na tabeli `flashcards` zapewnią, że użytkownik może wstawiać dane wyłącznie w swoim imieniu (dopasowując `user_id` do `auth.uid()`).
- **Walidacja danych wejściowych**: Użycie Zod do walidacji ciała żądania zapobiega wprowadzaniu nieprawidłowych lub złośliwych danych do bazy.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy ciało żądania nie przejdzie walidacji (np. brak pola `front` lub `back`).
- **401 Unauthorized**: Zwracany, gdy żądanie jest wysyłane przez nieuwierzytelnionego użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku problemów z bazą danych lub innych nieoczekiwanych błędów serwera. Szczegóły błędu będą logowane po stronie serwera.

## 8. Rozważania dotyczące wydajności

- Operacja jest prostym wstawieniem pojedynczego rekordu do bazy danych, co jest wysoce wydajne.
- Nie przewiduje się problemów z wydajnością dla tego punktu końcowego.

## 9. Etapy wdrożenia

1.  **Aktualizacja Route Handlera**: Dodać nową funkcję `POST` do istniejącego pliku `src/app/api/flashcards/route.ts`.
2.  **Implementacja uwierzytelniania**: Dodać logikę sprawdzającą sesję użytkownika na początku funkcji `POST`.
3.  **Definicja schemy walidacji**: W pliku `src/lib/validators.ts` dodać schemę Zod dla `CreateFlashcardCommand`, upewniając się, że `front` i `back` są niepustymi stringami.
4.  **Aktualizacja serwisu**: Dodać nową metodę `createFlashcard` do istniejącej klasy `FlashcardService` w pliku `src/services/flashcardService.ts`.
5.  **Implementacja logiki bazodanowej**: W metodzie `createFlashcard` zaimplementować logikę wstawiania nowego rekordu do tabeli `flashcards`.
6.  **Finalizacja Route Handlera**: W funkcji `POST` połączyć logikę uwierzytelniania, walidacji i wywołania serwisu. Dodać obsługę błędów `try...catch` i formatowanie odpowiedzi.
7.  **Testowanie manualne**: Przetestować endpoint przy użyciu narzędzia do wysyłania żądań HTTP dla scenariuszy sukcesu i błędów (np. brakujące pola, brak uwierzytelnienia).

---

# API Endpoint Implementation Plan: GET /api/flashcards/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do pobierania pojedynczej fiszki na podstawie jej unikalnego identyfikatora (`id`). Dostęp do fiszki jest ograniczony wyłącznie do użytkownika, który jest jej właścicielem.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards/[id]` (dynamiczny segment w Next.js)
- **Parametry ścieżki (Path Parameters)**:
  - `id` (number): Unikalny identyfikator fiszki.

## 3. Wykorzystywane typy

- **DTO (Response)**: `FlashcardDto`

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "id": 1,
    "user_id": "user-uuid-123",
    "generation_id": null,
    "front": "What is REST?",
    "back": "Representational State Transfer.",
    "status": "approved",
    "source": "MANUAL",
    "is_edited": false,
    "created_at": "2023-10-27T10:00:00Z",
    "updated_at": "2023-10-27T10:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Dynamiczny Route Handler w `src/app/api/flashcards/[id]/route.ts` odbiera żądanie `GET`. Identyfikator `id` jest dostępny w parametrach funkcji handlera.
2.  **Uwierzytelnianie**: Sprawdzana jest sesja użytkownika. W przypadku braku uwierzytelnienia, zwracany jest błąd `401`.
3.  **Walidacja**: Parametr `id` ze ścieżki URL jest walidowany, aby upewnić się, że jest to poprawna liczba. W przypadku niepowodzenia walidacji, zwracany jest błąd `400`.
4.  **Wywołanie serwisu**: Route Handler wywołuje nową metodę `getFlashcardById` w `FlashcardService`, przekazując `id` fiszki oraz `user_id` z sesji.
5.  **Logika biznesowa (w `FlashcardService`)**:
    a. Metoda wykonuje zapytanie do bazy danych w celu znalezienia fiszki, która ma pasujące `id` ORAZ `user_id`.
    b. Zapytanie będzie miało postać: `supabase.from('flashcards').select('*').eq('id', id).eq('user_id', userId).single()`.
    c. Użycie `.single()` zapewnia, że zapytanie zwróci pojedynczy obiekt lub `null`, jeśli nie znaleziono pasującego rekordu.
6.  **Obsługa wyniku**:
    a. Jeśli zapytanie do bazy danych zwróci `null` (co oznacza, że fiszka nie istnieje lub nie należy do użytkownika), serwis rzuci błąd `NotFoundError`.
    b. Jeśli wystąpi inny błąd bazy danych, zostanie on rzucony dalej.
    c. Jeśli fiszka zostanie znaleziona, serwis ją zwróci.
7.  **Wysłanie odpowiedzi**: Route Handler w bloku `try...catch` przechwytuje błędy. Jeśli złapie `NotFoundError`, zwróci status `404`. W przypadku sukcesu, zwróci obiekt fiszki i status `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint jest niedostępny dla nieuwierzytelnionych użytkowników.
- **Autoryzacja**: Kluczowym elementem bezpieczeństwa jest filtrowanie wyników nie tylko po `id`, ale również po `user_id` pobranym z sesji. Zapobiega to możliwości odgadnięcia `id` i uzyskania dostępu do fiszek innych użytkowników. Stanowi to dodatkową, jawną warstwę zabezpieczeń oprócz polityk RLS.
- **Walidacja**: Sprawdzenie, czy `id` jest liczbą, chroni przed potencjalnymi błędami w zapytaniach do bazy danych.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, jeśli `id` w URL nie jest prawidłową liczbą.
- **401 Unauthorized**: Zwracany, gdy użytkownik nie jest zalogowany.
- **404 Not Found**: Zwracany, gdy fiszka o podanym `id` nie istnieje LUB nie należy do uwierzytelnionego użytkownika. Odpowiedź jest celowo taka sama w obu przypadkach, aby nie ujawniać informacji o istnieniu zasobów.
- **500 Internal Server Error**: Zwracany w przypadku problemów z bazą danych lub innych błędów serwera.

## 8. Rozważania dotyczące wydajności

- Zapytanie do bazy danych jest wykonywane na kluczu głównym (`id`), co jest najszybszą możliwą operacją odczytu i nie powinno stanowić problemu wydajnościowego.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku Route Handlera**: Stworzyć nową strukturę katalogów i plik `src/app/api/flashcards/[id]/route.ts`.
2.  **Implementacja funkcji GET**: W nowym pliku zaimplementować funkcję `GET(request, { params })`.
3.  **Implementacja uwierzytelniania i walidacji**: Dodać logikę sprawdzającą sesję użytkownika i walidującą `params.id`.
4.  **Aktualizacja serwisu**: Dodać nową metodę `getFlashcardById(id, userId)` do `FlashcardService`.
5.  **Implementacja logiki bazodanowej**: W `FlashcardService` zaimplementować zapytanie do Supabase, które pobiera fiszkę na podstawie `id` i `user_id`.
6.  **Finalizacja Route Handlera**: Połączyć handler z serwisem, dodać obsługę błędów `try...catch`, w szczególności dla przypadku `404 Not Found`.
7.  **Testowanie manualne**: Przetestować endpoint, sprawdzając:
    - Poprawne pobieranie istniejącej fiszki.
    - Próbę pobrania nieistniejącej fiszki (`404`).
    - Próbę pobrania fiszki innego użytkownika (powinno zwrócić `404`).
    - Próbę dostępu bez uwierzytelnienia (`401`).
    - Użycie nieprawidłowego `id` (np. stringa) w URL (`400`).

---

# API Endpoint Implementation Plan: PATCH /api/flashcards/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia aktualizację istniejącej fiszki. Użytkownik może modyfikować jej treść (`front`, `back`) lub zmieniać jej status (np. z `waiting_for_approval` na `approved`). Punkt końcowy jest zabezpieczony i pozwala na modyfikację wyłącznie własnych fiszek.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/flashcards/[id]`
- **Parametry ścieżki (Path Parameters)**:
  - `id` (number): Unikalny identyfikator fiszki do zaktualizowania.
- **Request Body**:
  ```json
  {
    "front": "string",
    "back": "string",
    "status": "approved"
  }
  ```
  _Wszystkie pola w ciele żądania są opcjonalne._

## 3. Wykorzystywane typy

- **Command Model (Request)**: `UpdateFlashcardCommand`
- **DTO (Response)**: `FlashcardDto`

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt fiszki.
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Funkcja `PATCH` w `src/app/api/flashcards/[id]/route.ts` odbiera żądanie.
2.  **Uwierzytelnianie i walidacja**: Sprawdzana jest sesja użytkownika oraz walidowany jest parametr `id` ze ścieżki. Ciało żądania jest walidowane przy użyciu schemy Zod dla `UpdateFlashcardCommand`.
3.  **Wywołanie serwisu**: Route Handler wywołuje metodę `updateFlashcard(id, userId, updateData)` w `FlashcardService`.
4.  **Logika biznesowa (w `FlashcardService`)**:
    a. Najpierw serwis pobiera oryginalną fiszkę (`id` i `userId`), aby upewnić się, że istnieje i należy do użytkownika. Jeśli nie, rzuca błąd `NotFoundError`.
    b. Przygotowywany jest obiekt z danymi do aktualizacji.
    c. **Logika `is_edited`**: Jeśli źródłem (`source`) oryginalnej fiszki jest `AI` i aktualizowana jest treść (`front` lub `back`), do obiektu aktualizacji automatycznie dodawane jest pole `is_edited: true`.
    d. Wykonywana jest operacja aktualizacji w bazie danych: `supabase.from('flashcards').update(updateObject).eq('id', id).select().single()`. Warunek `eq('user_id', ...)` nie jest tu konieczny, ponieważ RLS zapewnia bezpieczeństwo, a wcześniejsze sprawdzenie własności już to zagwarantowało.
5.  **Wysłanie odpowiedzi**: Serwis zwraca zaktualizowany obiekt fiszki. Route handler przechwytuje ewentualne błędy (`NotFoundError` -> `404`) i w przypadku sukcesu wysyła odpowiedź z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane dla każdego żądania.
- **Autoryzacja**: Logika serwisu najpierw weryfikuje, czy fiszka należy do użytkownika, zanim podejmie próbę aktualizacji. To, w połączeniu z politykami RLS w bazie danych, zapewnia, że użytkownicy nie mogą modyfikować cudzych danych.
- **Walidacja**: Zarówno parametr `id`, jak i ciało żądania są walidowane, aby zapobiec błędom i atakom.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy `id` jest nieprawidłowe lub ciało żądania nie przechodzi walidacji Zod.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **404 Not Found**: Fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
- **500 Internal Server Error**: Błędy bazy danych lub inne błędy serwera.

## 8. Rozważania dotyczące wydajności

- Operacja `UPDATE` na kluczu głównym jest bardzo wydajna. Nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **Aktualizacja Route Handlera**: Dodać funkcję `PATCH` do pliku `src/app/api/flashcards/[id]/route.ts`.
2.  **Definicja schemy walidacji**: Zaktualizować plik `src/lib/validators.ts`, dodając schemę Zod dla `UpdateFlashcardCommand`.
3.  **Aktualizacja serwisu**: Dodać nową metodę `updateFlashcard` do `FlashcardService`.
4.  **Implementacja logiki biznesowej**: W `FlashcardService` zaimplementować logikę weryfikacji własności, aktualizacji danych oraz automatycznego ustawiania flagi `is_edited`.
5.  **Finalizacja Route Handlera**: Połączyć wszystko w funkcji `PATCH`, dodając pełną obsługę błędów.
6.  **Testowanie manualne**: Sprawdzić różne scenariusze: aktualizację treści, statusu, obu naraz; próbę aktualizacji cudzej fiszki; użycie nieprawidłowych danych.

---

# API Endpoint Implementation Plan: DELETE /api/flashcards/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia trwałe usunięcie fiszki na podstawie jej identyfikatora. Użytkownik może usunąć każdą fiszkę, której jest właścicielem.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/flashcards/[id]`
- **Parametry ścieżki (Path Parameters)**:
  - `id` (number): Unikalny identyfikator fiszki do usunięcia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- Brak specyficznych typów DTO/Command.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content)**: Puste ciało odpowiedzi.
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  **Odbiór żądania**: Funkcja `DELETE` w `src/app/api/flashcards/[id]/route.ts` odbiera żądanie.
2.  **Uwierzytelnianie i walidacja**: Sprawdzana jest sesja użytkownika i walidowany jest parametr `id`.
3.  **Wywołanie serwisu**: Route Handler wywołuje metodę `deleteFlashcard(id, userId)` w `FlashcardService`.
4.  **Logika biznesowa (w `FlashcardService`)**:
    a. Wykonywana jest operacja usunięcia w bazie danych: `supabase.from('flashcards').delete().eq('id', id).eq('user_id', userId)`.
    b. **Weryfikacja usunięcia**: Wynik operacji `delete` z klienta Supabase zawiera `count` usuniętych wierszy. Jeśli `count` wynosi `0`, oznacza to, że fiszka o podanym `id` nie została znaleziona dla danego użytkownika. W takim przypadku serwis rzuca błąd `NotFoundError`.
5.  **Wysłanie odpowiedzi**: Route Handler przechwytuje `NotFoundError` i zwraca `404`. W przypadku pomyślnego usunięcia (`count > 0`), zwraca status `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane.
- **Autoryzacja**: Zapytanie `DELETE` zawiera warunek `eq('user_id', userId)`, co w połączeniu z politykami RLS uniemożliwia usunięcie fiszek należących do innych użytkowników.

## 7. Obsługa błędów

- **400 Bad Request**: `id` jest nieprawidłowe.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **404 Not Found**: Fiszka o podanym `id` nie istnieje lub nie należy do użytkownika.
- **500 Internal Server Error**: Błąd bazy danych.

## 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na kluczu głównym jest wysoce wydajna.

## 9. Etapy wdrożenia

1.  **Aktualizacja Route Handlera**: Dodać funkcję `DELETE` do pliku `src/app/api/flashcards/[id]/route.ts`.
2.  **Aktualizacja serwisu**: Dodać nową metodę `deleteFlashcard` do `FlashcardService`.
3.  **Implementacja logiki bazodanowej**: W `FlashcardService` zaimplementować operację `delete` wraz ze sprawdzaniem liczby usuniętych rekordów w celu obsługi przypadku `404`.
4.  **Finalizacja Route Handlera**: Połączyć handler z serwisem i zaimplementować obsługę błędów.
5.  **Testowanie manualne**: Sprawdzić usuwanie własnej fiszki; próbę usunięcia nieistniejącej fiszki; próbę usunięcia cudzej fiszki.
