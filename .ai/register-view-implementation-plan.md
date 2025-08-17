# Plan implementacji widoku Rejestracja

## 1. Przegląd

Widok rejestracji (`/register`) jest punktem wejścia dla nowych użytkowników, umożliwiając im utworzenie konta w aplikacji. Jego głównym celem jest zebranie niezbędnych danych uwierzytelniających (e-mail i hasło) w bezpieczny i przyjazny dla użytkownika sposób. Formularz waliduje dane po stronie klienta w celu zapewnienia natychmiastowej informacji zwrotnej, a następnie przekazuje je do Server Action, która komunikuje się z Supabase w celu utworzenia nowego użytkownika. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego widoku aplikacji.

## 2. Routing widoku

Widok będzie dostępny pod publiczną ścieżką:

- `/register`

Podobnie jak w przypadku widoku logowania, zalogowani użytkownicy próbujący uzyskać dostęp do tej ścieżki powinni być automatycznie przekierowywani na stronę główną (`/`) za pomocą `middleware`.

## 3. Struktura komponentów

Struktura komponentów będzie analogiczna do widoku logowania, wykorzystując `Shadcn/ui` do budowy interfejsu i zachowując podział na komponent serwerowy (strona) oraz komponent kliencki (formularz).

```
/register (Route)
└── RegisterPage (Komponent Serwerowy)
    └── RegisterForm (Komponent Kliencki: "use client")
        ├── Form (Wrapper z react-hook-form/Shadcn)
        │   ├── Card
        │   │   ├── CardHeader (Tytuł i opis)
        │   │   ├── CardContent (Pola formularza)
        │   │   │   ├── FormField (dla email)
        │   │   │   │   ├── FormLabel
        │   │   │   │   ├── FormControl -> Input
        │   │   │   │   └── FormMessage (Komunikat walidacji)
        │   │   │   ├── FormField (dla hasła)
        │   │   │   │   ├── FormLabel
        │   │   │   │   ├── FormControl -> Input[type=password]
        │   │   │   │   └── FormMessage (Komunikat walidacji)
        │   │   │   ├── FormField (dla potwierdzenia hasła)
        │   │   │   │   ├── FormLabel
        │   │   │   │   ├── FormControl -> Input[type=password]
        │   │   │   │   └── FormMessage (Komunikat walidacji)
        │   │   ├── CardFooter (Akcje)
        │   │   │   ├── Button[type=submit]
        │   └── Link (Przekierowanie do /login)
```

## 4. Szczegóły komponentów

### `RegisterPage`

- **Opis komponentu**: Komponent serwerowy dla ścieżki `/register`. Renderuje komponent `<RegisterForm />`, dbając o jego wyśrodkowanie na stronie w ramach publicznego layoutu.
- **Główne elementy**: `<RegisterForm />`.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `RegisterForm`

- **Opis komponentu**: Kluczowy komponent kliencki (`"use client"`) obsługujący całą logikę formularza rejestracji. Integruje `react-hook-form` z `Zod` do zarządzania stanem i walidacji, a także wywołuje Server Action do finalizacji procesu rejestracji.
- **Główne elementy**:
  - `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`: Komponenty budujące strukturę formularza.
  - `<Form>` (Shadcn): Wrapper integrujący `react-hook-form`.
  - `<FormField>` (Shadcn): Kontener dla każdego pola formularza.
  - `<Input>` (Shadcn): Pola dla adresu e-mail, hasła i jego potwierdzenia.
  - `<Button>` (Shadcn): Przycisk wywołujący akcję wysłania formularza.
  - `<Link>` (Next.js): Przekierowanie do strony logowania.
- **Obsługiwane interakcje**:
  - Wprowadzanie danych w polach `email`, `password` i `confirmPassword`.
  - Wysłanie formularza przyciskiem "Zarejestruj się" lub klawiszem Enter.
- **Obsługiwana walidacja**: Walidacja realizowana jest przy użyciu schematu Zod.
  - `email`: Musi być poprawnym adresem e-mail.
  - `password`: Musi mieć co najmniej 8 znaków, zawierać jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny.
  - `confirmPassword`: Musi być identyczne z polem `password`.
- **Typy**: `RegisterViewModel`.
- **Propsy**: Brak.

## 5. Typy

Na potrzeby widoku rejestracji zostanie zdefiniowany nowy ViewModel, który będzie służył do typowania danych formularza oraz jako schemat walidacji Zod.

- **`RegisterViewModel`**

  - **Opis**: Reprezentuje dane formularza rejestracyjnego. Schemat Zod zapewnia integralność i poprawność danych przed wysłaniem ich na serwer.
  - **Struktura**:

    ```typescript
    import { z } from 'zod'

    export const RegisterSchema = z
      .object({
        // Pole na adres e-mail, musi być w poprawnym formacie
        email: z
          .string()
          .email({ message: 'Proszę podać poprawny adres e-mail.' }),

        // Pole na hasło z wymogami bezpieczeństwa
        password: z
          .string()
          .min(8, { message: 'Hasło musi mieć co najmniej 8 znaków.' })
          .regex(/[A-Z]/, {
            message: 'Hasło musi zawierać co najmniej jedną wielką literę.',
          })
          .regex(/[a-z]/, {
            message: 'Hasło musi zawierać co najmniej jedną małą literę.',
          })
          .regex(/[0-9]/, {
            message: 'Hasło musi zawierać co najmniej jedną cyfrę.',
          })
          .regex(/[^A-Za-z0-9]/, {
            message: 'Hasło musi zawierać co najmniej jeden znak specjalny.',
          }),

        // Pole na potwierdzenie hasła
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        // Walidacja sprawdzająca, czy hasła są identyczne
        message: 'Hasła muszą być takie same.',
        path: ['confirmPassword'], // Błąd przypisany do pola confirmPassword
      })

    export type RegisterViewModel = z.infer<typeof RegisterSchema>
    ```

## 6. Zarządzanie stanem

Stan formularza będzie zarządzany lokalnie w komponencie `RegisterForm` za pomocą biblioteki `react-hook-form`.

- **Hook**: `useForm<RegisterViewModel>({ resolver: zodResolver(RegisterSchema) })`.
- **Zmienne stanu**:
  - Wartości pól (`email`, `password`, `confirmPassword`).
  - Stan walidacji i błędy (`formState.errors`).
  - Stan procesu wysyłania (`formState.isSubmitting`) do zarządzania stanem przycisku.
- **Niestandardowe hooki**: Nie są wymagane.

## 7. Integracja API

Komunikacja z backendem będzie realizowana przez Next.js Server Action.

- **Akcja**: `signup(formData: RegisterViewModel)`
- **Lokalizacja**: `src/app/auth/actions.ts`
- **Logika**:
  1. Akcja otrzymuje dane z formularza.
  2. Ponownie waliduje dane na serwerze przy użyciu `RegisterSchema`.
  3. Tworzy instancję klienta Supabase.
  4. Wywołuje metodę `supabase.auth.signUp({ email, password })`.
  5. W przypadku błędu z Supabase (np. e-mail już istnieje) zwraca obiekt błędu: `{ error: 'Użytkownik o tym adresie e-mail już istnieje.' }`.
  6. Po pomyślnej rejestracji, Supabase automatycznie loguje użytkownika, a akcja wywołuje `redirect('/')`.
- **Typy żądania i odpowiedzi**:
  - **Żądanie**: `RegisterViewModel`
  - **Odpowiedź (błąd)**: `Promise<{ error: string }>`
  - **Odpowiedź (sukces)**: `Promise<void>` (kończy się przekierowaniem)

## 8. Interakcje użytkownika

- **Wprowadzanie danych**: Użytkownik wypełnia pola formularza. `react-hook-form` na bieżąco aktualizuje stan.
- **Walidacja w czasie rzeczywistym**: Po utracie fokusu z pola lub próbie wysłania formularza, wyświetlane są komunikaty walidacyjne.
- **Wysyłanie formularza**: Kliknięcie przycisku "Zarejestruj się" blokuje go, wyświetla wskaźnik ładowania i wywołuje Server Action `signup`.
- **Nawigacja do logowania**: Kliknięcie linku "Masz już konto? Zaloguj się" przenosi użytkownika na stronę `/login`.

## 9. Warunki i walidacja

- **Format e-mail**: Walidowany przez Zod (`.email()`).
- **Siła hasła**: Walidowana przez Zod (`.min()` i `.regex()`) zgodnie z zdefiniowanymi regułami.
- **Zgodność haseł**: Walidowana przez Zod (`.refine()`).
- **Unikalność e-maila**: Weryfikowana po stronie serwera przez Supabase. Wynik jest komunikowany do klienta jako błąd i wyświetlany w formie "toasta".

## 10. Obsługa błędów

- **Błędy walidacji klienta**: Obsługiwane przez `react-hook-form` i Zod. Komunikaty o błędach są wyświetlane pod odpowiednimi polami za pomocą `<FormMessage />`.
- **Błąd unikalności e-maila (błąd serwera)**: Server Action zwraca obiekt `{ error }`. Komponent `RegisterForm` przechwytuje odpowiedź i wyświetla powiadomienie "toast" z komunikatem "Użytkownik o tym adresie e-mail już istnieje.".
- **Inne błędy serwera/sieci**: Wywołanie Server Action jest opakowane w blok `try...catch`. W przypadku niepowodzenia wyświetlany jest ogólny komunikat "Wystąpił nieoczekiwany błąd.".

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Utwórz plik `src/app/(auth)/register/page.tsx`, w którym znajdzie się komponent `RegisterPage`.
   - Utwórz plik `src/components/auth/register-form.tsx` dla komponentu `RegisterForm`.
   - Zaktualizuj plik `src/lib/validators.ts`, dodając `RegisterSchema` i typ `RegisterViewModel`.
2. **Implementacja `RegisterPage`**:
   - Stwórz komponent serwerowy, który importuje i renderuje `<RegisterForm />` w wyśrodkowanym kontenerze.
3. **Implementacja `RegisterForm`**:
   - Oznacz komponent jako `"use client"`.
   - Zbuduj interfejs formularza przy użyciu komponentów Shadcn/ui (`Card`, `Form`, `Input`, `Button`).
   - Skonfiguruj `useForm` z `RegisterSchema` jako resolverem.
   - Połącz pola formularza z `react-hook-form` za pomocą `<FormField>`.
   - Zaimplementuj funkcję `onSubmit`, która będzie wywoływać Server Action.
4. **Rozbudowa Server Action**:
   - W pliku `src/app/auth/actions.ts` dodaj funkcję `signup` oznaczoną jako `'use server'`.
   - Na razie zaimplementuj w niej logikę zwracającą statyczny błąd lub symulującą sukces w celu przetestowania przepływu.
5. **Integracja formularza z Server Action**:
   - W `onSubmit` w `RegisterForm` wywołaj akcję `signup`.
   - Dodaj obsługę stanu `isSubmitting`, aby dezaktywować przycisk i pokazać stan ładowania.
   - Zaimplementuj logikę obsługi odpowiedzi: wyświetlanie "toasta" w przypadku błędu.
6. **Finalizacja**:
   - Dodaj link nawigacyjny do strony logowania.
   - Upewnij się, że wszystkie komunikaty walidacyjne i błędy są poprawnie wyświetlane i dostępne.
