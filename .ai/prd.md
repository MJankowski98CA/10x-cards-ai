# Dokument wymagań produktu (PRD) - AI Flashcards

## 1. Przegląd produktu

AI Flashcards to aplikacja webowa umożliwiająca efektywne tworzenie i zarządzanie fiszkami edukacyjnymi przy wykorzystaniu sztucznej inteligencji. Aplikacja pozwala na automatyczne generowanie wysokiej jakości fiszek na podstawie wprowadzonego tekstu, jak również ich manualne tworzenie i edycję.

Główne cechy produktu:
- Generowanie fiszek przez AI na podstawie wprowadzonego tekstu
- Możliwość manualnego tworzenia i edycji fiszek
- Prosty system zarządzania fiszkami
- Intuicyjny interfejs z trzema głównymi zakładkami
- Integracja z gotowym algorytmem powtórek

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition. Użytkownicy potrzebują narzędzia, które:
- Przyspieszy proces tworzenia fiszek
- Zapewni wysoką jakość generowanych treści
- Pozwoli na łatwe zarządzanie i edycję fiszek
- Umożliwi efektywne wykorzystanie metody powtórek

## 3. Wymagania funkcjonalne

### 3.1 Interfejs użytkownika
- Trzy główne zakładki:
  1. Lista główna fiszek (zaakceptowane + dodane manualnie)
  2. Generator AI (formularz + lista do zaakceptowania)
  3. Formularz dodawania/edycji fiszek

### 3.2 Generowanie fiszek przez AI
- Pole tekstowe na maksymalnie 1000 znaków
- Suwak wyboru liczby generowanych fiszek (10-30, domyślnie 10)
- Synchroniczny pasek postępu podczas generowania
- Wizualne oznaczenie fiszek AI (fioletowa obwódka)
- Domyślnie status (AI), po edycji (AI_EDITED)

### 3.3 Zarządzanie fiszkami
- Dodawanie fiszek manualnie
- Edycja fiszek przed i po akceptacji
- Usuwanie fiszek
- Wizualne oznaczenie fiszek manualnych (pomarańczowa obwódka)
- Automatyczna akceptacja fiszki po edycji
- Status fiszki (AI, AI_EDITED, MANUAL)
- Domyślnie status (MANUAL)

### 3.4 System kont użytkowników
- Rejestracja i logowanie
- Przechowywanie fiszek per użytkownik
- Podstawowe zarządzanie kontem

## 4. Granice produktu

Funkcjonalności poza zakresem MVP:
- Własny algorytm powtórek
- Import plików (PDF, DOCX, etc.)
- Współdzielenie zestawów fiszek
- Integracje z platformami edukacyjnymi
- Aplikacje mobilne

## 5. Historyjki użytkowników

### Rejestracja i logowanie

US-001: Rejestracja nowego użytkownika
- Jako nowy użytkownik chcę utworzyć konto w systemie
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła
  - System weryfikuje unikalność adresu email
  - System wymaga silnego hasła
  - Po rejestracji użytkownik jest automatycznie zalogowany

US-002: Logowanie do systemu
- Jako zarejestrowany użytkownik chcę zalogować się do systemu
- Kryteria akceptacji:
  - Formularz logowania zawiera pola: email, hasło
  - System weryfikuje poprawność danych
  - Użytkownik otrzymuje informację o błędnych danych

### Generowanie fiszek przez AI

US-003: Generowanie fiszek przez AI
- Jako użytkownik chcę wygenerować fiszki na podstawie wprowadzonego tekstu
- Kryteria akceptacji:
  - Możliwość wprowadzenia tekstu do 1000 znaków
  - Wybór liczby generowanych fiszek (10-30)
  - Wyświetlanie paska postępu podczas generowania
  - Wygenerowane fiszki mają fioletową obwódkę

US-004: Przeglądanie wygenerowanych fiszek
- Jako użytkownik chcę przeglądać wygenerowane fiszki przed akceptacją
- Kryteria akceptacji:
  - Lista wygenerowanych fiszek w zakładce generatora AI
  - Możliwość podglądu obu stron fiszki
  - Wyraźne oznaczenie fiszek jako wygenerowanych przez AI

US-005: Akceptacja/odrzucanie fiszek AI
- Jako użytkownik chcę akceptować lub odrzucać wygenerowane fiszki
- Kryteria akceptacji:
  - Możliwość akceptacji pojedynczej fiszki
  - Możliwość odrzucenia fiszki
  - Zaakceptowane fiszki trafiają do głównej listy
  - Możliwość edycji fiszki przed akceptacją

### Manualne zarządzanie fiszkami

US-006: Tworzenie fiszek manualnie
- Jako użytkownik chcę tworzyć własne fiszki
- Kryteria akceptacji:
  - Formularz z polami: przód i tył fiszki
  - Walidacja długości tekstu
  - Fiszki oznaczone pomarańczową obwódką
  - Automatyczne dodanie do głównej listy

US-007: Edycja istniejących fiszek
- Jako użytkownik chcę edytować istniejące fiszki
- Kryteria akceptacji:
  - Możliwość edycji obu stron fiszki
  - Zapisanie zmian wymaga kliknięcia przycisku "Zapisz"
  - Automatyczne zapisywanie zmian (status fiszki z WAITING na APPROVED) w przypadku fiszki wygenerowanej przez AI i edytowanej przez użytkownika po kliknięciu przycisku "zapisz"
  - Zachowanie oryginalnego oznaczenia źródła fiszki

US-008: Usuwanie fiszek
- Jako użytkownik chcę usuwać niepotrzebne fiszki
- Kryteria akceptacji:
  - Możliwość usunięcia pojedynczej fiszki
  - Potwierdzenie przed usunięciem
  - Natychmiastowe usunięcie z listy

### Przeglądanie i zarządzanie

US-009: Przeglądanie głównej listy fiszek
- Jako użytkownik chcę przeglądać wszystkie moje fiszki
- Kryteria akceptacji:
  - Lista wszystkich zaakceptowanych i manualnie dodanych fiszek
  - Wizualne rozróżnienie źródła fiszek
  - Możliwość podglądu obu stron fiszki

US-010: Obsługa błędów generowania
- Jako użytkownik chcę być informowany o błędach podczas generowania
- Kryteria akceptacji:
  - Wyświetlanie komunikatu o błędzie
  - Możliwość ponowienia próby generowania
  - Zachowanie wprowadzonego tekstu

## 6. Metryki sukcesu

### 6.1 Główne wskaźniki
- 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika
- 75% wszystkich fiszek w systemie jest tworzonych z wykorzystaniem AI

### 6.2 Dodatkowe metryki
- Czas generowania fiszek przez AI
- Liczba edycji fiszek przed akceptacją
- Stosunek zaakceptowanych do odrzuconych fiszek AI
- Średnia liczba fiszek generowanych w jednej sesji 