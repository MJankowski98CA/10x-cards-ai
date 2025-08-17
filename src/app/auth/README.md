# Authentication Routes

This directory contains all authentication-related routes and components.

## Structure

- `login/` - Login page and related components
  - `page.tsx` - Login page component
  - `form.tsx` - Login form component
- `register/` - Registration page and related components
  - `page.tsx` - Registration page component
  - `form.tsx` - Registration form component

## Features

- User login with email/password
- User registration
- Password reset (TODO)
- OAuth providers (TODO)
- Protected routes
- Authentication state management

## Implementation Details

- Uses Next.js App Router
- Implements server-side authentication
- Uses secure HTTP-only cookies
- Implements CSRF protection
- Follows security best practices
