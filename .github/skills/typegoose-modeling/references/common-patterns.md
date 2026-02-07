# Enums & Common Patterns

## Using enums in models

Define shared enums using the `z.enum` pattern:

```typescript
// In packages/shared/src/enums/visibility.ts
import z from 'zod';

export const visibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']);
export const VISIBILITY = visibilitySchema.enum;
export type Visibility = z.infer<typeof visibilitySchema>;
```

Use in models with `enum` option:

```typescript
import { stringProp } from '../prop';
import { VISIBILITY, type Visibility } from '@startername/shared/enums/visibility';

@modelOptions({ schemaOptions: { collection: 'challenges' } })
class ChallengeClass {
  @stringProp({
    required: true,
    enum: Object.values(VISIBILITY),
    default: VISIBILITY.PUBLIC,
  })
  public visibility!: Visibility;
}
```

## Timestamps

Enable automatic `createdAt` and `updatedAt`:

```typescript
@modelOptions({
  schemaOptions: {
    collection: 'entities',
    timestamps: true,  // Enables timestamps
  },
})
class EntityClass {
  @objectIdProp()
  public _id!: string;

  @stringProp({ required: true })
  public name!: string;

  // Declare without decorators—Mongoose populates automatically
  public createdAt!: Date;
  public updatedAt!: Date;
}
```

## References to other documents

Use string IDs for references—no Mongoose ref field needed:

```typescript
// Simple reference
@stringProp({ required: true, index: true })
public userId!: string;

@stringProp({ required: true })
public creatorId!: string;

// Optional reference
@stringProp({ required: false })
public parentChallengeId?: string;
```

## Optional fields

**Option 1: Undefined (preferred)**
```typescript
@stringProp({ required: false })
public optionalField?: string;
// Can be undefined
```

**Option 2: Null**
```typescript
@stringProp({ default: null })
public optionalField!: string | null;
// Can be null but not undefined
```

**Option 3: Default value**
```typescript
@stringProp({ default: 'DEFAULT' })
public field!: string;
// Always has a value
```

## Collections naming

Always use plural, lowercase collection names:

```typescript
@modelOptions({
  schemaOptions: {
    collection: 'users',          // ✓ GOOD
    collection: 'User',           // ✗ BAD (singular, capitalized)
    collection: 'user_documents', // ✗ BAD (underscores instead of plural)
  },
})
class UserClass {
  // ...
}
```

## Exporting models and types

Always export both:

```typescript
import { getModelForClass } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

export const UserModel = getModelForClass(UserClass);
export type UserDoc = DocumentType<UserClass>;
```

Provides:
- `UserModel` - Runtime Mongoose model for queries
- `UserDoc` - TypeScript type for type-safe operations

## Array patterns

**Empty by default:**
```typescript
@stringArrayProp({ default: [] })
public tags!: string[];

@arrayProp(TagClass, { default: [] })
public tags!: TagClass[];
```

**Always present:**
```typescript
@stringArrayProp()
public tags!: string[];  // Required, must be array
```

**Optional:**
```typescript
@stringArrayProp()
public tags?: string[];  // May not exist
```
