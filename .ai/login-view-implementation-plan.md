# Plan implementacji widoku Logowanie

## 1. Przegląd

Widok logowania (`/login`) umożliwia zarejestrowanym użytkownikom uwierzytelnienie się w aplikacji. Jego głównym celem jest zapewnienie bezpiecznego dostępu do spersonalizowanych zasobów, takich jak prywatne zestawy fiszek. Widok składa się z prostego formularza, który po pomyślnej walidacji danych i uwierzytelnieniu przez Supabase przekierowuje użytkownika do głównego interfejsu aplikacji.

## 2. Routing widoku

Widok będzie dostępny pod publiczną ścieżką:

- `/login`

Użytkownicy, którzy są już zalogowani i spróbują uzyskać dostęp do tej ścieżki, powinni zostać automatycznie przekierowani do strony głównej (`/`) przez mechanizm `middleware`.

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane z wykorzystaniem biblioteki `Shadcn/ui`. Hierarchia będzie zorientowana na czytelność i reużywalność, z wyraźnym podziałem na komponent strony (logika routingu) i komponent formularza (logika stanu i interakcji).

```
/login (Route)
└── LoginPage (Komponent Serwerowy)
    └── LoginForm (Komponent Kliencki: "use client")
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
        │   │   ├── CardFooter (Akcje)
        │   │   │   ├── Button[type=submit]
        │   └── Link (Przekierowanie do /register)
```

## 4. Szczegóły komponentów

### `LoginPage`

- **Opis komponentu**: Komponent serwerowy renderowany dla ścieżki `/login`. Jego jedynym zadaniem jest wyrenderowanie komponentu `LoginForm` wewnątrz głównego layoutu, zapewniając wyśrodkowanie na stronie.
- **Główne elementy**: `<LoginForm />`.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `LoginForm`

- **Opis komponentu**: Komponent kliencki (`"use client"`) zawierający logikę formularza logowania. Będzie zarządzał stanem pól, obsługiwał walidację po stronie klienta oraz wywoływał Server Action w celu uwierzytelnienia użytkownika.
- **Główne elementy**:
  - `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>`: Struktura wizualna formularza.
  - `<Form>` (Shadcn): Wrapper integrujący `react-hook-form`.
  - `<FormField>` (Shadcn): Kontener dla każdego pola, łączący etykietę, input i komunikat błędu.
  - `<Input>` (Shadcn): Pola do wprowadzania adresu e-mail i hasła.
  - `<Button>` (Shadcn): Przycisk do wysłania formularza.
  - `<Link>` (Next.js): Przekierowanie do strony rejestracji.
- **Obsługiwane interakcje**:
  - Wprowadzanie tekstu w polach `email` i `password`.
  - Wysłanie formularza za pomocą przycisku "Zaloguj się" lub klawisza Enter.
- **Obsługiwana walidacja**: Walidacja jest realizowana przy użyciu `Zod` i `react-hook-form`.
  - `email`: Musi być poprawnym formatem adresu e-mail. Komunikat: "Proszę podać poprawny adres e-mail."
  - `password`: Nie może być pusty. Komunikat: "Hasło nie może być puste."
- **Typy**: `LoginViewModel`.
- **Propsy**: Brak.

## 5. Typy

Do implementacji widoku wymagany będzie jeden nowy typ, który posłuży jako ViewModel dla formularza i jednocześnie jako schemat walidacji Zod.

- **`LoginViewModel`**

  - **Opis**: Reprezentuje dane formularza logowania. Zdefiniowany za pomocą Zod, co umożliwia jednoczesne uzyskanie typu TypeScript i schematu walidacyjnego.
  - **Struktura**:

    ```typescript
    import { z } from 'zod'

    export const LoginSchema = z.object({
      // Pole na adres e-mail użytkownika
      email: z
        .string()
        .email({ message: 'Proszę podać poprawny adres e-mail.' }),

      // Pole na hasło użytkownika
      password: z.string().min(1, { message: 'Hasło nie może być puste.' }),
    })

    export type LoginViewModel = z.infer<typeof LoginSchema>
    ```

## 6. Zarządzanie stanem

Zarządzanie stanem formularza będzie w całości obsługiwane przez bibliotekę `react-hook-form` wewnątrz komponentu `LoginForm`.

- **Hook**: `useForm<LoginViewModel>({ resolver: zodResolver(LoginSchema) })`.
- **Zmienne stanu**:
  - Wartości pól (`email`, `password`) są zarządzane wewnętrznie przez hook.
  - Stan walidacji (`formState.errors`) jest automatycznie aktualizowany na podstawie schematu Zod.
  - Stan wysyłania (`formState.isSubmitting`) będzie używany do blokowania przycisku i wyświetlania wskaźnika ładowania podczas komunikacji z serwerem.
- **Niestandardowe hooki**: Nie ma potrzeby tworzenia niestandardowych hooków.

## 7. Integracja API

Integracja z backendem odbędzie się za pośrednictwem **Next.js Server Action**, a nie tradycyjnego endpointu API.

- **Akcja**: `login(formData: LoginViewModel)`
- **Lokalizacja**: `src/app/auth/actions.ts` (sugerowana)
- **Logika**:

  1. Akcja przyjmuje dane z formularza.
  2. Waliduje dane za pomocą `LoginSchema`.
  3. Tworzy instancję klienta Supabase po stronie serwera.
  4. Wywołuje metodę `supabase.auth.signInWithPassword({ email, password })`.
  5. W przypadku błędu (np. nieprawidłowe dane) zwraca obiekt `{ error: 'Nieprawidłowe dane logowania.' }`.
  6. W przypadku sukcesu, wywołuje `redirect('/')` w celu przekierowania użytkownika.

- **Typy żądania i odpowiedzi**:
  - **Żądanie (argumenty akcji)**: `LoginViewModel`
  - **Odpowiedź (w przypadku błędu)**: `Promise<{ error: string }>`
  - **Odpowiedź (w przypadku sukcesu)**: `Promise<void>` (następuje przekierowanie)

## 8. Interakcje użytkownika

- **Wpisywanie danych**: Użytkownik wpisuje e-mail i hasło. Stan jest aktualizowany w czasie rzeczywistym przez `react-hook-form`.
- **Walidacja on-blur/on-change**: Komunikaty o błędach walidacji pojawiają się pod polami po ich opuszczeniu lub po próbie wysłania formularza.
- **Wysyłanie formularza**:
  - Kliknięcie przycisku "Zaloguj się" wywołuje funkcję `onSubmit`.
  - Przycisk jest blokowany, a na nim pojawia się ikona ładowania.
  - Wywoływana jest Server Action `login`.
- **Nawigacja do rejestracji**: Kliknięcie linku "Nie masz konta? Zarejestruj się" przenosi użytkownika na stronę `/register`.

## 9. Warunki i walidacja

- **Email**: Musi być zgodny ze standardowym formatem adresu e-mail. Walidacja `z.string().email()` po stronie klienta.
- **Hasło**: Musi zawierać co najmniej jeden znak. Walidacja `z.string().min(1)` po stronie klienta.
- **Poprawność danych**: Weryfikacja e-maila i hasła w Supabase po stronie serwera. Stan interfejsu (wyświetlenie błędu) jest aktualizowany na podstawie odpowiedzi z Server Action.

## 10. Obsługa błędów

- **Błędy walidacji klienta**: Obsługiwane przez `react-hook-form` i `zod`. Komunikaty są wyświetlane bezpośrednio pod odpowiednimi polami formularza za pomocą komponentu `<FormMessage />`.
- **Błędne dane logowania (błąd serwera)**: Server Action zwraca obiekt z kluczem `error`. Komponent `LoginForm` przechwytuje tę odpowiedź i wyświetla powiadomienie typu "toast" (np. przy użyciu `sonner`) z komunikatem "Nieprawidłowe dane logowania.".
- **Błędy sieciowe / krytyczne błędy serwera**: Wywołanie Server Action jest opakowane w blok `try...catch`. W przypadku nieoczekiwanego wyjątku wyświetlany jest generyczny toast "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.".

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Utwórz plik `src/app/(auth)/login/page.tsx`, który będzie zawierał komponent `LoginPage`.
   - Utwórz plik `src/components/auth/login-form.tsx`, który będzie zawierał komponent `LoginForm`.
   - Zaktualizuj plik `src/lib/validators.ts` o `LoginSchema` i typ `LoginViewModel`.
2. **Implementacja komponentu `LoginPage`**:
   - Stwórz prosty komponent serwerowy, który importuje i renderuje `<LoginForm />` wewnątrz wyśrodkowanego kontenera.
3. **Instalacja zależności**:
   - Upewnij się, że zainstalowane są `react-hook-form`, `zod`, `@hookform/resolvers`.
4. **Implementacja komponentu `LoginForm`**:
   - Oznacz komponent jako `"use client"`.
   - Zaimplementuj strukturę UI przy użyciu komponentów Shadcn/ui (`Card`, `Form`, `Input`, `Button`, `Label`).
   - Skonfiguruj `useForm` z `LoginSchema` jako resolverem.
   - Powiąż pola formularza z `react-hook-form` za pomocą komponentów `<FormField>` i `form.control`.
   - Zaimplementuj funkcję `onSubmit`, która będzie przyjmować dane i na razie logować je do konsoli.
5. **Utworzenie Server Action**:
   - Stwórz plik `src/app/auth/actions.ts` (jeśli nie istnieje).
   - Zaimplementuj funkcję `login` oznaczoną jako `'use server'`, która przyjmuje dane, ale na razie zwraca statyczną odpowiedź błędu do testów.
6. **Połączenie formularza z Server Action**:
   - W `onSubmit` w `LoginForm` wywołaj akcję `login`.
   - Dodaj obsługę stanu `isSubmitting` do dezaktywacji przycisku i wyświetlania spinnera.
   - Zaimplementuj logikę obsługi odpowiedzi: jeśli akcja zwróci `{ error }`, wyświetl toast; w przeciwnym razie (w przyszłości) nastąpi przekierowanie.
7. **Stylowanie i finalizacja**:
   - Dodaj link do strony rejestracji pod formularzem.
   - Upewnij się, że komunikaty walidacji i błędy wyświetlają się poprawnie i są dostępne (np. poprzez atrybuty `aria`).
