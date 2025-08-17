# Project Structure - Next.js 15.3 App Router

This document describes the project structure for the Next.js 15.3 application with App Router.

## Source Directory Structure (`src/`)

```
src/
├── app/                  # Next.js App Router routes
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   ├── auth/           # Authentication routes
│   │   ├── login/      # Login page and components
│   │   └── register/   # Registration page and components
│   ├── dashboard/      # Protected dashboard routes
│   └── resources/      # Resource management (CRUD)
│       ├── page.tsx    # List view
│       ├── create/     # Create resource
│       └── [id]/       # Dynamic resource routes
├── components/          # Reusable React components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── auth/           # Auth components
│   └── common/         # Shared components
├── lib/                # Utility functions and logic
│   ├── utils/         # General utilities
│   ├── constants/     # Constants
│   ├── config/        # Configuration
│   ├── validation/    # Validation schemas
│   └── helpers/       # Helper functions
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── services/          # API and service integrations
│   ├── api/          # API client
│   ├── auth/         # Auth service
│   ├── resources/    # Resource service
│   └── external/     # External integrations
├── types/            # TypeScript type definitions
└── tests/            # Test files
    ├── unit/        # Unit tests
    ├── e2e/         # End-to-end tests
    └── mocks/       # Test mocks and utilities
```
