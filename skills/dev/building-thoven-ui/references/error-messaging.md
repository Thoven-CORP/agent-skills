# Thoven Error Messaging Patterns

User-friendly error handling for the Thoven platform. Never show technical jargon - always provide helpful, encouraging messages.

## Contents
- Philosophy
- Error Type Color Coding
- Pattern 1: General API Error
- Pattern 2: Session/Auth Notice (Non-Blocking)
- Pattern 3: Empty State
- Pattern 4: Progressive Loading Messages
- Pattern 5: Inline Load Error (Pagination)
- Pattern 6: Form Validation Error
- Error Message Copy Guidelines
- Anti-Patterns
- Rules

---

## Philosophy

1. **No technical codes**: Never show 404, 500, 503, etc. to users
2. **Encouraging tone**: "Something went wrong" not "Error occurred"
3. **Actionable**: Always tell users what they can do next
4. **Amber over Red**: Use amber backgrounds to reduce anxiety (red = alarming)
5. **Recovery path**: Provide retry buttons, alternative actions, or fallback options

---

## Error Type Color Coding

| Type | Background | Border | Icon | Use For |
|------|------------|--------|------|---------|
| General failure | `bg-amber-50` | `border-amber-200` | Lightbulb | API errors, server issues |
| Info/session | `bg-sky-50` | `border-sky-200` | Info circle | Auth timeout, soft notices |
| Empty state | `bg-amber-100` | `border-amber-200` | Context icon | No results, empty lists |
| Form validation | `bg-red-50` | `border-red-200` | Alert | Field-level errors only |

---

## Pattern 1: General API Error

Use when: Server returns 500, network fails, or unknown error.

```tsx
<div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
  {/* Icon */}
  <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>

  <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">
    Something went wrong
  </h3>
  <p className="text-gray-600 mb-4 font-sans max-w-md mx-auto">
    Please try again in a second.
  </p>

  {/* Retry Button - Uses Thoven 3D pattern */}
  <button
    onClick={handleRetry}
    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600
      text-white font-sans font-semibold rounded-xl
      shadow-[0_4px_0_0_rgb(217,119,6)] hover:shadow-[0_2px_0_0_rgb(217,119,6)]
      active:shadow-[0_1px_0_0_rgb(217,119,6)] active:translate-y-1 transition-all duration-200"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    Try Again
  </button>

  <p className="mt-4 text-sm text-gray-500 font-sans">
    Still not working? Try refreshing the page.
  </p>
</div>
```

**Key Elements:**
- Amber background (not alarming red)
- Lightbulb icon in rounded container
- `font-display` for heading, `font-sans` for body
- Thoven 3D button with retry icon
- Fallback suggestion text

---

## Pattern 2: Session/Auth Notice (Non-Blocking)

Use when: Session expired but user can continue browsing.

```tsx
<div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6">
  <div className="flex items-center">
    <div className="flex-shrink-0">
      <div className="bg-sky-100 p-2 rounded-xl">
        <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
    <div className="ml-3 flex-1">
      <p className="text-sm text-sky-800 font-sans">
        <span className="font-semibold">Quick note:</span> Your session timed out, but no worries -
        you can still browse! <a href="/login" className="underline hover:text-sky-900">Sign in</a> to save progress.
      </p>
    </div>
    <button
      onClick={dismiss}
      className="ml-3 text-sky-400 hover:text-sky-600 transition-colors"
      aria-label="Dismiss"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
```

**Key Elements:**
- Blue background (informational, not error)
- Info circle icon
- Reassuring language ("no worries")
- Dismissible with X button
- Sign in link for recovery
- Does NOT block user interaction

---

## Pattern 3: Empty State

Use when: Search returns no results or list is empty.

```tsx
<div className="text-center py-16">
  <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
    <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  </div>

  <h3 className="text-xl font-bold text-gray-900 mb-3 font-display">
    No teachers match your search
  </h3>
  <p className="text-gray-600 mb-6 font-sans max-w-md mx-auto">
    We couldn't find teachers with those exact criteria. Try broadening your search!
  </p>

  <button
    onClick={clearFilters}
    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600
      text-white font-sans font-semibold rounded-xl
      shadow-[0_4px_0_0_rgb(217,119,6)] hover:shadow-[0_2px_0_0_rgb(217,119,6)]
      active:shadow-[0_1px_0_0_rgb(217,119,6)] active:translate-y-1 transition-all duration-200"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    Browse All Teachers
  </button>
</div>
```

**Key Elements:**
- Large icon with rounded amber background
- Context-appropriate icon (users for teacher search)
- Helpful language ("Try broadening your search!")
- Clear recovery action button
- Offers alternative path

---

## Pattern 4: Progressive Loading Messages

Use when: Loading takes longer than expected.

```tsx
function LoadingWithProgress() {
  const [loadingDuration, setLoadingDuration] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        {/* Spinner */}
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        {/* Progressive message */}
        <p className="text-gray-600 font-sans">
          {loadingDuration < 3 ? (
            'Finding teachers...'
          ) : loadingDuration < 10 ? (
            'Still searching... this may take a moment'
          ) : loadingDuration < 20 ? (
            'Almost there... thank you for your patience'
          ) : (
            'Taking longer than expected... please wait'
          )}
        </p>

        {/* Show elapsed time after 5 seconds */}
        {loadingDuration >= 5 && (
          <p className="text-gray-400 text-sm mt-2 font-sans">
            {loadingDuration}s elapsed
          </p>
        )}
      </div>
    </div>
  )
}
```

**Message Progression:**
| Duration | Message |
|----------|---------|
| 0-3s | "Finding teachers..." |
| 3-10s | "Still searching... this may take a moment" |
| 10-20s | "Almost there... thank you for your patience" |
| 20s+ | "Taking longer than expected... please wait" |

---

## Pattern 5: Inline Load Error (Pagination)

Use when: "Load more" fails but existing content is still visible.

```tsx
<div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-xl mx-4 mt-4">
  <p className="text-gray-700 font-sans mb-3">
    Having trouble loading more. Give it another try!
  </p>
  <button
    onClick={handleLoadMore}
    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600
      text-white font-sans font-semibold rounded-xl
      shadow-[0_4px_0_0_rgb(217,119,6)] hover:shadow-[0_2px_0_0_rgb(217,119,6)]
      active:shadow-[0_1px_0_0_rgb(217,119,6)] active:translate-y-1 transition-all duration-200"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    Load More
  </button>
</div>
```

**Key Elements:**
- Inline with existing content (not overlay)
- Conversational language ("Give it another try!")
- Smaller, compact design
- Doesn't lose existing data

---

## Pattern 6: Form Validation Error

Use when: User input is invalid.

```tsx
<div className="space-y-1.5">
  <label className="font-sans font-medium text-sm text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    className="font-sans w-full px-3 py-2
      border border-red-300 rounded-lg
      focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:outline-none
      bg-red-50"
  />
  <p className="font-sans text-xs text-red-500 flex items-center gap-1">
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd" />
    </svg>
    Please enter a valid email address
  </p>
</div>
```

**Key Elements:**
- Red only for field-level validation (acceptable here)
- Small icon with error message
- Specific, helpful error text
- Input border changes to red
- Light red background on input

---

## Error Message Copy Guidelines

| Technical Error | User-Friendly Message |
|----------------|----------------------|
| 404 Not Found | "We couldn't find what you're looking for" |
| 500 Internal Server Error | "Something went wrong on our end" |
| 503 Service Unavailable | "We're experiencing high traffic. Please try again" |
| Network Error | "Connection issue. Check your internet and try again" |
| Timeout | "This is taking longer than usual. Please try again" |
| 401 Unauthorized | "Your session has expired. Please sign in again" |
| 403 Forbidden | "You don't have access to this. Need help?" |
| Validation Error | [Specific field error, e.g., "Email format is invalid"] |
| Rate Limited | "Too many requests. Please wait a moment and try again" |
| File Too Large | "File is too large. Maximum size is [X]MB" |

---

## Anti-Patterns

### DO NOT DO THIS

```tsx
// WRONG - Technical jargon
<p>Error 500: Internal Server Error</p>
<p>Request failed with status code 404</p>
<p>TypeError: Cannot read property 'data' of undefined</p>
<p>ECONNREFUSED: Connection refused</p>
<p>Unhandled promise rejection</p>

// WRONG - Blame the user
<p>Invalid input</p>
<p>Bad request</p>
<p>You made an error</p>

// WRONG - No action provided
<p>Something went wrong</p>
// (with no button or suggestion)

// WRONG - Alarming colors for non-critical
<div className="bg-red-500 text-white">Session expired</div>
```

### DO THIS INSTEAD

```tsx
// CORRECT - User-friendly
<p>Something went wrong. Please try again.</p>
<p>We couldn't find that page.</p>
<p>Unable to load your data. Please refresh.</p>

// CORRECT - Helpful and actionable
<p>Please enter a valid email address (e.g., name@example.com)</p>

// CORRECT - With recovery action
<div>
  <p>Something went wrong</p>
  <button>Try Again</button>
  <p>Still not working? Try refreshing the page.</p>
</div>

// CORRECT - Soft colors for non-critical
<div className="bg-sky-50">Session expired - you can still browse!</div>
```

---

## Rules

1. **NEVER** display HTTP status codes (404, 500, 503)
2. **NEVER** show stack traces or technical error messages
3. **NEVER** show raw API error responses
4. **ALWAYS** provide a retry or recovery action
5. **USE** amber (`bg-amber-50`) for most errors - reduces anxiety
6. **USE** sky (`bg-sky-50`) for informational notices
7. **RESERVE** red for field-level validation only
8. **KEEP** messages short and actionable
9. **ADD** fallback suggestions ("Try refreshing the page")
10. **USE** `font-sans` for all error text, `font-display` only for error titles

---

## Reference Implementation

See `app/marketplace/page.tsx` for the canonical implementation of these patterns in production code.
