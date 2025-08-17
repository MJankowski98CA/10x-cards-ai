# App Directory (App Router)

This directory contains all the routes and pages of the application using Next.js 15.3 App Router.

## Structure

- `layout.tsx` - Root layout component
- `page.tsx` - Home page component
- `auth/` - Authentication routes (login, register)
  - `login/` - Login page and related components
  - `register/` - Registration page and related components
- `dashboard/` - Protected dashboard routes
- `resources/` - Resource management routes
  - `[id]/` - Dynamic routes for individual resources

## Conventions

- Use route groups for better organization
- Keep page components lean, move logic to components/services
- Follow Next.js file conventions:
  - `layout.tsx` - Layout components
  - `page.tsx` - Page components
  - `loading.tsx` - Loading states
  - `error.tsx` - Error boundaries
  - `not-found.tsx` - 404 pages
