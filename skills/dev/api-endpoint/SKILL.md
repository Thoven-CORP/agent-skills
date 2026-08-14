---
name: api-endpoint
description: "Use when the user asks to create a new API integration file, add a new backend endpoint function, scaffold a fetch wrapper, or add a new -api.ts file in lib/. Triggers on keywords: API, endpoint, fetch, backend, integration, rails."
---

## File Naming

Kebab-case with `-api.ts` suffix in `lib/`. Examples: `teacher-booking-api.ts`, `parent-calendar-api.ts`.

## Quick Reference

| Element | Pattern |
|---|---|
| **Imports** | `import { API_BASE_URL, handleApiError } from './api'` |
| **Auth headers** | `import { getAuthenticatedRailsHeaders } from './rails-headers'` |
| **Public headers** | `import { getRailsHeaders } from './rails-headers'` |
| **GET (auth)** | `fetch(\`${API_BASE_URL}/api/v1/...\`, { method: 'GET', headers: getAuthenticatedRailsHeaders() })` |
| **GET (public)** | `fetch(\`${API_BASE_URL}/api/v1/...\`, { method: 'GET', headers: getRailsHeaders() })` |
| **POST/PATCH/DELETE** | Add `body: JSON.stringify(data)` to fetch options |
| **Function prefixes** | `fetch*` (GET list), `get*` (GET single), `create*` (POST), `update*` (PATCH/PUT), `delete*` (DELETE), `list*` (paginated GET) |
| **Response unwrap** | `const data = await response.json(); return data.data` |

## Code Example (from codebase)

```typescript
import { API_BASE_URL, handleApiError } from './api'
import { getAuthenticatedRailsHeaders } from './rails-headers'

// --- TypeScript interfaces first ---

export interface BookingRequest {
  id: string
  student_name: string
  status: 'pending' | 'confirmed' | 'rejected'
}

// --- Authenticated GET ---

export const fetchBookingRequests = async (): Promise<BookingRequest[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/teachers/requests`, {
      method: 'GET',
      headers: getAuthenticatedRailsHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch booking requests: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error: any) {
    console.error('Error fetching booking requests:', error)
    throw new Error(handleApiError(error))
  }
}

// --- Authenticated PATCH ---

export const updateRequestStatus = async (
  requestId: string,
  status: 'confirmed' | 'rejected'
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/teachers/requests/${requestId}`, {
      method: 'PATCH',
      headers: getAuthenticatedRailsHeaders(),
      body: JSON.stringify({ status })
    })

    if (!response.ok) {
      throw new Error(`Failed to update request status: ${response.status}`)
    }
  } catch (error: any) {
    console.error('Error updating request status:', error)
    throw new Error(handleApiError(error))
  }
}
```

## Common Mistakes

- **Wrong import**: Using `API_CONFIG` instead of `API_BASE_URL` from `./api`
- **Missing `/api/v1/` prefix**: All endpoints start with `/api/v1/`
- **Using `fetch` headers directly**: Always use `getRailsHeaders()` (public) or `getAuthenticatedRailsHeaders()` (auth) -- never manually build Content-Type/Accept headers
- **Forgetting `handleApiError`**: Always wrap thrown errors with `throw new Error(handleApiError(error))`
- **Not unwrapping response**: Backend wraps data in `data.data`, not `data` directly
- **Direct component fetch calls**: Never call `fetch()` in components -- always create a function in `lib/*-api.ts`
