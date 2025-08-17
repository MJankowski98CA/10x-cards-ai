# Resources Routes

This directory contains all resource management routes implementing CRUD operations.

## Structure

- `page.tsx` - List view of all resources
- `create/` - Create new resource
  - `page.tsx` - Create form
- `[id]/` - Dynamic routes for individual resources
  - `page.tsx` - Resource details
  - `edit/` - Edit resource
    - `page.tsx` - Edit form
  - `delete/` - Delete confirmation

## Features

- List all resources with pagination
- Create new resources
- View resource details
- Edit existing resources
- Delete resources
- Search and filtering
- Sorting

## Implementation Details

- Server Components for initial data fetch
- Client Components for interactive features
- Optimistic updates
- Form validation
- Error handling
- Loading states
- Proper TypeScript types
