# Plan Testów dla Aplikacji AI Flashcards

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument określa strategię, zakres, podejście i zasoby przeznaczone do testowania aplikacji AI Flashcards. Aplikacja, zbudowana w oparciu o Next.js i Supabase, ma na celu zrewolucjonizowanie procesu tworzenia fiszek edukacyjnych poprzez wykorzystanie AI. Plan ten stanowi podstawę dla wszystkich działań związanych z zapewnieniem jakości (QA).

### 1.2. Cele testowania

Głównym celem procesu testowego jest zapewnienie wysokiej jakości, niezawodności i bezpieczeństwa aplikacji przed jej wdrożeniem na środowisko produkcyjne.

**Cele szczegółowe:**

- Weryfikacja zgodności zaimplementowanych funkcjonalności z wymaganiami określonymi w dokumencie PRD.
- Identyfikacja i zaraportowanie defektów w oprogramowaniu.
- Zapewnienie stabilności i wydajności kluczowych modułów (uwierzytelnianie, generowanie fiszek).
- Weryfikacja bezpieczeństwa danych użytkowników, ze szczególnym uwzględnieniem izolacji danych.
- Zapewnienie spójnego i intuicyjnego interfejsu użytkownika na różnych urządzeniach i przeglądarkach.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- **Moduł uwierzytelniania:**
  - Rejestracja nowego użytkownika.
  - Logowanie i wylogowywanie.
  - Obsługa błędów (np. niepoprawne dane, zajęty email).
  - Ochrona tras wymagających autoryzacji.
- **Moduł generowania fiszek AI:**
  - Przesyłanie formularza z tekstem i parametrami.
  - Wyświetlanie stanu ładowania/paska postępu.
  - Poprawne wyświetlanie wygenerowanych fiszek.
  - Obsługa błędów API (np. timeout, błąd serwera AI).
  - Akceptacja i odrzucanie wygenerowanych fiszek.
- **Moduł zarządzania fiszkami (CRUD):**
  - Tworzenie nowej fiszki manualnie.
  - Edycja istniejących fiszek (AI i manualnych).
  - Usuwanie fiszek.
  - Wyświetlanie listy fiszek z paginacją.
  - Wizualne rozróżnienie typów fiszek.
- **Moduł nauki:**
  - Poprawne działanie karuzeli fiszek.
  - Wyświetlanie przedniej i tylnej strony fiszki.
- **Interfejs użytkownika:**
  - Responsywność na głównych breakpointach (mobile, tablet, desktop).
  - Spójność wizualna komponentów.
  - Dostępność (WCAG) - podstawowy poziom.

### 2.2. Funkcjonalności wyłączone z testów (MVP)

- Własny algorytm "spaced repetition".
- Import/eksport fiszek.
- Współdzielenie zestawów fiszek.
- Zaawansowane testy wydajnościowe i obciążeniowe.

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):**
  - **Cel:** Weryfikacja pojedynczych funkcji, komponentów i logiki w izolacji.
  - **Zakres:** Funkcje pomocnicze (`utils`), walidatory (`validators`), akcje serwerowe (z mockowaniem zależności), proste komponenty React.
- **Testy integracyjne (Integration Tests):**
  - **Cel:** Weryfikacja współpracy pomiędzy różnymi modułami aplikacji.
  - **Zakres:** Integracja komponentów front-endowych z akcjami serwerowymi, współpraca warstwy usług (`services`) z bazą danych Supabase (na dedykowanej bazie testowej), integracja z API AI (z użyciem mock serwera).
- **Testy End-to-End (E2E):**
  - **Cel:** Symulacja rzeczywistych scenariuszy użytkowania aplikacji z perspektywy użytkownika.
  - **Zakres:** Pełne przepływy użytkownika, np. rejestracja -> logowanie -> wygenerowanie fiszek -> akceptacja -> nauka.
- **Testy regresji wizualnej (Visual Regression Testing):**
  - **Cel:** Wykrywanie niezamierzonych zmian w interfejsie użytkownika.
  - **Zakres:** Kluczowe komponenty UI, główne widoki aplikacji.
- **Testy manualne eksploracyjne:**
  - **Cel:** Identyfikacja błędów, które trudno jest wykryć w testach automatycznych, poprzez swobodne eksplorowanie aplikacji.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

| ID          | Funkcjonalność                  | Scenariusz                                                                                            | Oczekiwany rezultat                                                                                                | Priorytet |
| :---------- | :------------------------------ | :---------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-------- |
| **AUTH-01** | Rejestracja                     | Użytkownik podaje poprawne i unikalne dane w formularzu rejestracji.                                  | Konto zostaje utworzone, użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.                | Krytyczny |
| **AUTH-02** | Logowanie                       | Zarejestrowany użytkownik podaje poprawne dane logowania.                                             | Użytkownik zostaje zalogowany i przekierowany na stronę główną.                                                    | Krytyczny |
| **GEN-01**  | Generowanie fiszek (Happy Path) | Użytkownik wprowadza tekst (poniżej 1000 znaków), wybiera liczbę fiszek i klika "Generuj".            | Wyświetla się pasek postępu, a po chwili lista wygenerowanych fiszek z fioletową obwódką.                          | Krytyczny |
| **GEN-02**  | Generowanie fiszek (Błąd API)   | API AI zwraca błąd podczas generowania.                                                               | Pasek postępu znika, wyświetlany jest komunikat o błędzie, a formularz zachowuje wprowadzone dane.                 | Wysoki    |
| **CARD-01** | Tworzenie manualne              | Użytkownik wypełnia formularz tworzenia nowej fiszki i zapisuje go.                                   | Nowa fiszka z pomarańczową obwódką pojawia się na głównej liście fiszek.                                           | Wysoki    |
| **CARD-02** | Edycja fiszki AI                | Użytkownik edytuje wygenerowaną fiszkę (przed akceptacją) i zapisuje zmiany.                          | Fiszka zostaje automatycznie zaakceptowana, jej status zmienia się na `AI_EDITED` i pojawia się na głównej liście. | Wysoki    |
| **CARD-03** | Usuwanie fiszki                 | Użytkownik klika przycisk usuwania na dowolnej fiszce i potwierdza operację.                          | Fiszka zostaje trwale usunięta z listy.                                                                            | Wysoki    |
| **SEC-01**  | Izolacja danych                 | Użytkownik A (zalogowany) próbuje uzyskać dostęp do fiszek użytkownika B poprzez modyfikację URL/API. | System odmawia dostępu. Użytkownik A widzi tylko i wyłącznie swoje własne fiszki.                                  | Krytyczny |

## 5. Środowisko testowe

- **Baza danych:** Dedykowana instancja Supabase/PostgreSQL dla środowiska testowego, regularnie czyszczona i wypełniana danymi testowymi (seed).
- **API AI:** Mock serwer (np. przy użyciu `msw` - Mock Service Worker) symulujący odpowiedzi OpenRouter.ai, w tym przypadki błędów i opóźnień.
- **Przeglądarki:** Testy E2E będą uruchamiane na najnowszych wersjach Chrome i Firefox. Testy manualne powinny objąć również Safari.
- **Urządzenia:** Symulacja urządzeń mobilnych (w narzędziach deweloperskich przeglądarki) oraz testy na fizycznych urządzeniach w miarę możliwości.

## 6. Narzędzia do testowania

- **Framework do testów jednostkowych i integracyjnych:** [Vitest](https://vitest.dev/) (ze względu na szybkość i kompatybilność z ekosystemem Vite/Next.js).
- **Framework do testów E2E:** [Playwright](https://playwright.dev/) (ze względu na szybkość, niezawodność i zaawansowane możliwości, takie jak auto-waiting).
- **Biblioteka do testowania komponentów React:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (promuje dobre praktyki testowania z perspektywy użytkownika).
- **Mockowanie API:** [Mock Service Worker (MSW)](https://mswjs.io/) do przechwytywania i mockowania zapytań sieciowych na poziomie sieci.
- **Testy regresji wizualnej:** [Lost Pixel](https://lost-pixel.com/) lub integracja z Playwright.
- **Zarządzanie testami i raportowanie błędów:** [GitHub Issues](https://github.com/features/issues) / [Jira](https://www.atlassian.com/software/jira).

## 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwojowym.

- **Sprint deweloperski:**
  - Developerzy piszą testy jednostkowe i integracyjne dla nowo tworzonych funkcjonalności.
  - Testy są automatycznie uruchamiane przy każdym commicie do repozytorium (CI).
- **Przed wydaniem (Release Candidate):**
  - Uruchomienie pełnego zestawu testów E2E na środowisku stagingowym.
  - Przeprowadzenie testów manualnych eksploracyjnych.
  - Weryfikacja i zamknięcie wszystkich krytycznych i wysokopriorytetowych błędów.
- **Po wdrożeniu (Post-release):**
  - Testy dymne (smoke tests) na środowisku produkcyjnym w celu weryfikacji kluczowych funkcjonalności.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia (rozpoczęcia testów)

- Funkcjonalność została zaimplementowana i jest dostępna na środowisku deweloperskim/stagingowym.
- Testy jednostkowe i integracyjne napisane przez deweloperów przechodzą pomyślnie.

### 8.2. Kryteria wyjścia (zakończenia testów i akceptacji wydania)

- 100% testów automatycznych (jednostkowych, integracyjnych, E2E) przechodzi pomyślnie.
- Wszystkie zidentyfikowane błędy o priorytecie `Krytyczny` i `Wysoki` zostały naprawione i zweryfikowane.
- Brak znanych regresji w kluczowych funkcjonalnościach.
- Dokumentacja testowa została zaktualizowana.

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy:**
  - Tworzenie testów jednostkowych i integracyjnych dla swojego kodu.
  - Naprawianie błędów zgłoszonych przez zespół QA.
  - Utrzymanie i dbanie o jakość kodu.
- **Inżynier QA (Automatyzujący):**
  - Projektowanie i implementacja scenariuszy testowych E2E.
  - Rozwój i utrzymanie frameworka do automatyzacji testów.
  - Analiza wyników testów automatycznych.
- **Inżynier QA (Manualny) / Product Owner:**
  - Przeprowadzanie testów manualnych eksploracyjnych.
  - Weryfikacja zgodności z wymaganiami biznesowymi.
  - Tworzenie i priorytetyzacja zgłoszeń błędów.

## 10. Procedury raportowania błędów

Wszystkie zidentyfikowane defekty muszą być raportowane w systemie do śledzenia błędów (np. GitHub Issues) i zawierać następujące informacje:

- **Tytuł:** Zwięzły i jednoznaczny opis problemu.
- **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
- **Kroki do odtworzenia:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
- **Obserwowany rezultat:** Co się stało po wykonaniu kroków.
- **Oczekiwany rezultat:** Co powinno się stać.
- **Priorytet/Waga:** Określenie wpływu błędu na działanie aplikacji (np. Krytyczny, Wysoki, Średni, Niski).
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.

Każdy zgłoszony błąd będzie analizowany, priorytetyzowany, a następnie przypisywany do odpowiedniego dewelopera w celu jego naprawy.
