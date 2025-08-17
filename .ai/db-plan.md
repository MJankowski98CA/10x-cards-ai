## Schemat bazy danych PostgreSQL

### 1. Przegląd Architektury

Schemat opiera się na dwóch głównych tabelach: `generations` i `flashcards`.

- **`generations`**: Tabela ta działa jak dziennik zdarzeń, przechowując metadane dotyczące każdego procesu generowania fiszek przez AI. Pozwala na analizę wydajności i jakości generowanych treści.
- **`flashcards`**: Centralna tabela przechowująca wszystkie fiszki, niezależnie od ich pochodzenia (AI czy manualne) i statusu (oczekujące na akceptację, zatwierdzone).

### 2. Typy ENUM

Definiujemy niestandardowe typy, które będą używane w tabeli `flashcards` do określania jej stanu.

```sql
CREATE TYPE flashcard_status AS ENUM ('waiting_for_approval', 'approved');
CREATE TYPE flashcard_source AS ENUM ('AI', 'MANUAL');
```

### 3. Tabele

#### Tabela `generations`

Przechowuje informacje o każdym zadaniu generowania fiszek przez AI.

- `id` SERIAL PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id) - Identyfikator użytkownika, który zainicjował generowanie.
- `model` VARCHAR(100) - Nazwa modelu AI użytego do generowania (np. 'gpt-4o').
- `generated_count` INT NOT NULL - Liczba fiszek, o wygenerowanie których poprosił użytkownik.
- `accepted_unedited_count` INT DEFAULT 0 - Licznik zaakceptowanych fiszek z tej generacji, które nie były edytowane.
- `accepted_edited_count` INT DEFAULT 0 - Licznik zaakceptowanych fiszek z tej generacji, które użytkownik edytował.
- `source_text_hash` VARCHAR(64) - Skrót (hash) tekstu źródłowego, do analityki i unikania duplikatów.
- `source_text_length` INT NOT NULL - Długość tekstu źródłowego.
- `generation_duration` INT - Czas trwania generowania w milisekundach.
- `created_at` / `updated_at` TIMESTAMPTZ - Znaczniki czasu.

#### Tabela `flashcards`

Przechowuje wszystkie fiszki.

- `id` SERIAL PRIMARY KEY
- `user_id` UUID NOT NULL REFERENCES auth.users(id)
- `generation_id` BIGINT REFERENCES generations(id) ON DELETE SET NULL - Klucz obcy wskazujący na zadanie generowania, z którego pochodzi fiszka. `NULL` dla fiszek manualnych.
- `front` / `back` VARCHAR - Treść fiszki.
- `status` flashcard_status NOT NULL - Status fiszki (`waiting_for_approval` lub `approved`).
- `source` flashcard_source NOT NULL - Pierwotne źródło fiszki (`AI` lub `MANUAL`).
- `is_edited` BOOLEAN NOT NULL DEFAULT false - Flaga `true`, jeśli fiszka typu `AI` została zmodyfikowana przez użytkownika.
- `created_at` / `updated_at` TIMESTAMPTZ

### 4. Relacje

- **1:N** między `auth.users` a `generations` (użytkownik może mieć wiele generacji).
- **1:N** między `auth.users` a `flashcards` (użytkownik może mieć wiele fiszek).
- **1:N** między `generations` a `flashcards` (jedno zadanie generowania może stworzyć wiele fiszek).

### 5. Indeksy

- Na kolumnie `generations.user_id`.
- Na kolumnach `flashcards.user_id`, `flashcards.generation_id`, `flashcards.status` i `flashcards.source` dla optymalizacji filtrowania.

### 6. Zasady RLS (Row-Level Security)

Włączamy RLS dla obu tabel, aby zapewnić, że użytkownicy mają dostęp wyłącznie do swoich danych.

```sql
-- Polityka dla generations
CREATE POLICY "Users can manage their own generations"
    ON generations FOR ALL USING ( auth.uid() = user_id );

-- Polityka dla flashcards
CREATE POLICY "Users can manage their own flashcards"
    ON flashcards FOR ALL USING ( auth.uid() = user_id );
```

### 7. Triggery

Funkcja `update_updated_at_column()` i odpowiednie triggery są stosowane na obu tabelach, aby automatycznie aktualizować pole `updated_at` przy każdej modyfikacji rekordu.

---

_Schemat został zaprojektowany w celu klarownego oddzielenia metadanych procesu generowania (tabela `generations`) od właściwej treści fiszek (tabela `flashcards`). Takie podejście ułatwia analizę danych i zarządzanie cyklem życia fiszek._
