# Dependency Injection (DI) System

## Quick Start: Adding a New Service

When adding a new service to the DI container, follow this streamlined pattern:

### Step 1: Update `tokens.ts`

Add your service using this template (copy-paste and modify):

```typescript
// 1. Import the service type
import type { MyService } from '@~/features/my-feature/my-feature.service';

// 2. Create the token constant (inside the token declarations section)
const myServiceToken: unique symbol = Symbol.for('MyService');

// 3. Add to TOKENS object
export const TOKENS = {
  // ... existing tokens
  MyService: myServiceToken,
} as const;

// 4. Add to iTokenRegistry interface
export interface iTokenRegistry {
  // ... existing mappings
  [TOKENS.MyService]: MyService;
}
```

### Step 2: Register in `container.ts`

```typescript
export async function registerServices() {
  const { MyService } = await import('@~/features/my-feature/my-feature.service');
  
  // For singleton:
  container.registerSingleton(TOKENS.MyService, MyService);
  
  // OR for transient (new instance each time):
  container.register(TOKENS.MyService, { useClass: MyService }, { lifecycle: Lifecycle.Transient });
}
```

### Step 3: Use the Service

The service is now automatically available through GETTERS (no manual step needed):

```typescript
import { GETTERS } from '@~/routers/di-getter';

// In your handler:
const myService = GETTERS.MyService();
const result = await myService.doSomething();
```

## Why This Pattern?

TypeScript requires `unique symbol` types for computed property keys in interfaces. This is a language constraint that cannot be worked around with helper functions or macros. The pattern above is the most concise valid approach.

## Architecture Notes

- **TOKENS**: Object mapping service names to unique symbols
- **iTokenRegistry**: Interface mapping symbols to TypeScript types
- **GETTERS**: Auto-generated convenience wrapper (no manual maintenance required)
- **container**: tsyringe DI container with registered services

The GETTERS map is automatically generated from TOKENS, so you only need to update `tokens.ts` and `container.ts` when adding services.
