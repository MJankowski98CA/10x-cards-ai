# Architektura UI dla AI Flashcards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji AI Flashcards została zaprojektowana w oparciu o model zorientowany na zadania, z centralnym punktem w postaci dynamicznej listy fiszek. Zamiast tradycyjnej nawigacji opartej na zakładkach, użytkownik jest prowadzony przez aplikację za pomocą kontekstowych przycisków akcji, co upraszcza interfejs i skupia uwagę na kluczowych przepływach pracy: generowaniu, zarządzaniu i nauce.

Aplikacja wykorzystuje architekturę Next.js App Router, intensywnie korzystając z Komponentów Serwerowych do renderowania danych i Server Actions do ich modyfikacji. Taka strategia minimalizuje ilość kodu po stronie klienta, poprawia wydajność i upraszcza zarządzanie stanem. Stan widoku listy jest kontrolowany przez parametry w adresie URL, co zapewnia spójność i możliwość udostępniania linków.

Struktura dzieli się na dwa główne layouty: publiczny dla stron uwierzytelniania oraz chroniony, główny layout aplikacji dla zalogowanych użytkowników.

## 2. Lista widoków

---

### **Widok: Logowanie**

- **Ścieżka widoku**: `/login`
- **Główny cel**: Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje do wyświetlenia**: Formularz logowania.
- **Kluczowe komponenty widoku**:
  - `Card`: Kontener dla formularza.
  - `Input`: Pola na adres e-mail i hasło.
  - `Button`: Przycisk do przesłania formularza.
  - `Link`: Przekierowanie do widoku Rejestracji.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Czytelne komunikaty walidacji pod polami. Powiadomienie "toast" w przypadku błędnych danych logowania.
  - **Dostępność**: Poprawne etykiety (`Label`) dla pól formularza. Obsługa nawigacji za pomocą klawiatury.
  - **Bezpieczeństwo**: Komunikacja z serwerem przez Server Action. Hasło przesyłane bezpiecznie.

---

### **Widok: Rejestracja**

- **Ścieżka widoku**: `/register`
- **Główny cel**: Utworzenie nowego konta użytkownika.
- **Kluczowe informacje do wyświetlenia**: Formularz rejestracji.
- **Kluczowe komponenty widoku**:
  - `Card`: Kontener dla formularza.
  - `Input`: Pola na e-mail, hasło i potwierdzenie hasła.
  - `Button`: Przycisk do przesłania formularza.
  - `Link`: Przekierowanie do widoku Logowania.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Walidacja siły hasła i zgodności haseł po stronie klienta.
  - **Dostępność**: Poprawne etykiety i atrybuty `aria` dla pól formularza.
  - **Bezpieczeństwo**: Walidacja danych po stronie serwera w Server Action.

---

### **Widok: Główny - Lista Fiszek**

- **Ścieżka widoku**: `/`
- **Główny cel**: Wyświetlanie, filtrowanie i zarządzanie fiszkami użytkownika. Służy jako główny pulpit nawigacyjny.
- **Kluczowe informacje do wyświetlenia**:
  - Lista fiszek (zatwierdzonych lub oczekujących na zatwierdzenie).
  - Aktywny stan widoku i filtrów.
  - Informacje o paginacji.
- **Kluczowe komponenty widoku**:
  - `Header`: Nagłówek z przyciskami akcji "Dodaj manualnie" i "Generuj z AI".
  - `ToggleGroup`: Przełącznik widoku "Zatwierdzone" / "Do zatwierdzenia".
  - `DropdownMenu`: Filtr fiszek według źródła ("Wszystkie", "AI", "Manualne") - widoczny tylko dla "Zatwierdzonych".
  - `FlashcardList`: Komponent renderujący siatkę fiszek.
  - `FlashcardListSkeleton`: Komponent wyświetlający szkielet UI podczas ładowania danych.
  - `Pagination`: Kontrolki do nawigacji między stronami.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Stan widoku (filtr, strona, typ listy) jest odzwierciedlony w parametrach URL, co pozwala na odświeżenie strony bez utraty kontekstu. Płynne przejścia i stany ładowania (skeleton) poprawiają odczucia z użytkowania.
  - **Dostępność**: Kontrolki filtrów i paginacji są w pełni dostępne z klawiatury.
  - **Bezpieczeństwo**: Widok chroniony przez Middleware. Wszystkie dane są pobierane po stronie serwera w kontekście zalogowanego użytkownika.

---

### **Widok: Formularz Generatora AI**

- **Ścieżka widoku**: `/generator`
- **Główny cel**: Umożliwienie użytkownikowi szybkiego wygenerowania fiszek na podstawie dostarczonego tekstu.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na tekst źródłowy i liczbę fiszek.
- **Kluczowe komponenty widoku**:
  - `Card`: Kontener dla formularza.
  - `Textarea`: Pole na tekst źródłowy (do 1000 znaków).
  - `Slider` / `Input`: Kontrolka do wyboru liczby fiszek (10-30).
  - `Button`: Przycisk "Generuj".
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasne instrukcje i walidacja długości tekstu oraz zakresu liczby fiszek. Po submisji użytkownik jest automatycznie przekierowywany do listy oczekujących fiszek.
  - **Dostępność**: Wszystkie elementy formularza mają powiązane etykiety.
  - **Bezpieczeństwo**: Widok chroniony. Walidacja danych wejściowych realizowana jest po stronie serwera w Server Action.

---

### **Widok: Formularz Manualny / Edycji Fiszki**

- **Ścieżka widoku**: `/nowa` (tworzenie), `/[id]/edycja` (edycja)
- **Główny cel**: Ręczne tworzenie nowej fiszki lub modyfikacja istniejącej.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na przód i tył fiszki.
- **Kluczowe komponenty widoku**:
  - `Card`: Kontener dla formularza.
  - `Textarea`: Pole na tekst "przodu" fiszki.
  - `Textarea`: Pole na tekst "tyłu" fiszki.
  - `Button`: Przycisk "Zapisz".
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Prosty i czytelny formularz. Po zapisaniu użytkownik jest przekierowywany z powrotem do listy fiszek, co zapewnia płynny przepływ pracy.
  - **Dostępność**: Pola formularza są odpowiednio oetykietowane.
  - **Bezpieczeństwo**: Widok chroniony. Dane są walidowane w Server Action. W przypadku edycji, akcja serwerowa weryfikuje, czy użytkownik jest właścicielem edytowanej fiszki.

---

### **Widok: Tryb Nauki (Karuzela)**

- **Ścieżka widoku**: `/study` (z parametrami URL, np. `?source=AI&start_id=123`)
- **Główny cel**: Umożliwienie skoncentrowanej nauki i przeglądania zatwierdzonych fiszek w trybie pełnoekranowym.
- **Kluczowe informacje do wyświetlenia**:
  - Pojedyncza fiszka (widoczna strona przednia lub tylna).
  - Kontrolki nawigacyjne (następna/poprzednia fiszka).
  - Wskaźnik postępu (np. "Fiszka 5 z 50").
- **Kluczowe komponenty widoku**:
  - `Dialog`: Komponent do wyświetlania trybu nauki jako pełnoekranowy modal.
  - `Carousel`: Komponent karuzeli do nawigacji między fiszkami.
  - `FlippableCard`: Specjalny komponent karty, który obsługuje animację obracania po kliknięciu.
  - `Button`: Przyciski nawigacyjne i przycisk do zamknięcia widoku.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Płynna animacja obracania karty. Intuicyjna nawigacja gestami (przesunięcie) na urządzeniach dotykowych. Stan odwrócenia karty resetuje się przy przejściu do następnej.
  - **Dostępność**: Pełna obsługa za pomocą klawiatury (strzałki do nawigacji, spacja/enter do odwracania karty, `Esc` do zamknięcia).
  - **Bezpieczeństwo**: Widok pobiera tylko dane fiszek należących do zalogowanego użytkownika.

## 3. Mapa podróży użytkownika

Główny przepływ pracy użytkownika (tzw. "happy path") koncentruje się na generowaniu fiszek przez AI:

1.  **Logowanie**: Użytkownik loguje się na stronie `/login` i jest przekierowywany na główną listę fiszek (`/`).
2.  **Inicjacja Generowania**: Na liście fiszek klika przycisk "Generuj z AI", przechodząc do widoku `/generator`.
3.  **Wprowadzanie Danych**: Wypełnia formularz, wklejając tekst i wybierając liczbę fiszek, po czym klika "Generuj".
4.  **Przekierowanie do Przeglądu**: Po przetworzeniu żądania przez serwer, użytkownik jest automatycznie przekierowywany na listę fiszek, ale z aktywnym widokiem "Do zatwierdzenia" (`/?view=pending`).
5.  **Zarządzanie Wygenerowanymi Fiszkami**: Użytkownik przegląda listę i wykonuje akcje:
    - **Akceptuje** fiszkę, która znika z listy oczekujących i pojawia się na liście zatwierdzonych.
    - **Odrzuca** fiszkę, która jest trwale usuwana.
    - **Edytuje** fiszkę, przechodząc do widoku `/[id]/edycja`. Po zapisaniu zmian jest przekierowywany z powrotem na listę zatwierdzonych, a fiszka jest automatycznie akceptowana.
6.  **Praca z Fiszkami**: Użytkownik przełącza się z powrotem na widok "Zatwierdzone", gdzie może przeglądać wszystkie swoje fiszki, filtrować je, edytować lub usuwać.
7.  **Rozpoczęcie Nauki**: Użytkownik klika na dowolną fiszkę na liście "Zatwierdzonych". Zostaje przeniesiony do widoku Trybu Nauki (`/study`).
8.  **Sesja Nauki**: W widoku karuzeli, użytkownik:
    - Klika na fiszkę, aby ją odwrócić i zobaczyć odpowiedź.
    - Używa strzałek nawigacyjnych, aby przełączać się między kolejnymi fiszkami z zestawu (zgodnego z ostatnio użytym filtrem).
    - Po zakończeniu nauki, zamyka widok i wraca do głównej listy fiszek.

## 4. Układ i struktura nawigacji

Struktura nawigacyjna aplikacji jest celowo minimalistyczna i oparta na akcjach, aby nie rozpraszać użytkownika.

- **Layouty**:
  - **Layout Publiczny**: Prosty, wyśrodkowany kontener dla formularzy logowania i rejestracji. Nie zawiera żadnych elementów nawigacyjnych poza linkami między tymi dwoma widokami.
  - **Layout Główny (Chroniony)**: Obejmuje wszystkie widoki po zalogowaniu. Zawiera stały nagłówek z tytułem aplikacji i przyciskiem "Wyloguj". Treść główna (lista, formularze) renderowana jest pod nagłówkiem.
- **Nawigacja**:
  - Brak stałego menu nawigacyjnego (np. bocznego paska).
  - Przejścia między głównymi sekcjami aplikacji odbywają się poprzez kliknięcie przycisków akcji (np. "Generuj z AI" na liście głównej).
  - Powrót z formularzy na listę odbywa się automatycznie po pomyślnym przesłaniu danych.
  - Stan widoku listy (oczekujące/zatwierdzone, filtry, strona) jest zarządzany przez parametry URL, co czyni nawigację przewidywalną i spójną z działaniem przeglądarki (przycisk "wstecz"/"dalej").
  - Przejście do Trybu Nauki odbywa się przez kliknięcie fiszki na liście głównej. Jest to dedykowany widok, który przejmuje cały ekran, a powrót z niego następuje przez dedykowany przycisk "zamknij" lub "wróć".

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika. Komponenty te zostaną zbudowane w oparciu o bibliotekę `Shadcn/ui`.

- **`<Flashcard />`**:
  - **Opis**: Komponent typu `Card` wyświetlający przód i tył pojedynczej fiszki. Renderuje różne zestawy kontrolek (przycisków akcji) w zależności od kontekstu (widok "Zatwierdzone" vs "Do zatwierdzenia"). Odpowiada za wyświetlanie kolorowej obwódki w zależności od źródła fiszki (`AI` lub `MANUAL`).
- **`<FlashcardList />`**:
  - **Opis**: Komponent odpowiedzialny za renderowanie siatki lub listy komponentów `<Flashcard />`. Otrzymuje dane fiszek jako `props`.
- **`<FlashcardListControls />`**:
  - **Opis**: Komponent-kontener grupujący wszystkie kontrolki listy: przełącznik widoku, menu filtrów i paginację. Zarządza logiką zmiany parametrów URL.
- **`<AuthForm />`**:
  - **Opis**: Reużywalny komponent formularza dla logowania i rejestracji, który obsługuje logikę walidacji i komunikacji z Server Actions.
- **`<ToastProvider />`**:
  - **Opis**: Globalny dostawca dla powiadomień "toast", który będzie używany do wyświetlania komunikatów o sukcesie lub błędzie operacji w całej aplikacji.
- **`<StudyCarousel />`**:
  - **Opis**: Główny komponent widoku nauki. Wykorzystuje komponent karuzeli (np. z `Shadcn/ui`) do zarządzania nawigacją między fiszkami i renderuje dla każdej z nich komponent `<FlippableCard />`.
- **`<FlippableCard />`**:
  - **Opis**: Wariant komponentu `<Flashcard />` lub nowy komponent, który zarządza stanem (odwrócony/nieodwrócony) i obsługuje animację CSS do obracania karty po kliknięciu.
