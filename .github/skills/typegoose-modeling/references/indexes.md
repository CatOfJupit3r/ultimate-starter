# Indexes & Query Optimization

Use indexes to optimize frequently queried field combinations.

## Single-field indexes

Add `index: true` to frequently queried fields:

```typescript
@stringProp({ required: true, index: true })
public ownerId!: string;

@stringProp({ required: true, index: true })
public email!: string;
```

## Unique constraints

Use `unique: true` for fields requiring uniqueness:

```typescript
@stringProp({ required: true, unique: true })
public email!: string;

@stringProp({ required: true, unique: true })
public username!: string;
```

## Compound indexes

Use `@index` decorator for multi-field indexes optimizing common query patterns:

```typescript
import { index, modelOptions } from '@typegoose/typegoose';
import { objectIdProp, stringProp } from '../prop';

@index({ ownerId: 1, createdAt: -1 })        // Sort by date descending
@index({ visibility: 1, archived: 1 })       // Filter both
@index({ visibility: 1, archived: 1, createdAt: -1 })  // Filter + sort
@modelOptions({
  schemaOptions: { collection: 'challenges' },
})
class ChallengeClass {
  @objectIdProp()
  public _id!: string;

  @stringProp({ required: true })
  public ownerId!: string;

  @stringProp({ required: true, enum: ['PUBLIC', 'PRIVATE'] })
  public visibility!: string;

  @booleanProp({ default: false })
  public archived!: boolean;

  public createdAt!: Date;
}
```

## Index ordering matters

Field order in compound indexes affects query performance:

```typescript
// For query: find({ visibility: 'PUBLIC', archived: false }).sort({ createdAt: -1 })
// Use this order: filter fields first, then sort field
@index({ visibility: 1, archived: 1, createdAt: -1 })  ✓ GOOD

// NOT this (sort field first is slower)
@index({ createdAt: -1, visibility: 1, archived: 1 })  ✗ SLOWER
```

## Ascending vs descending

- `1` = ascending (useful for exact matches, range queries)
- `-1` = descending (useful for sorting, latest-first queries)

```typescript
// Find user's challenges, newest first
@index({ userId: 1, createdAt: -1 })

// Find archived items by date range
@index({ archived: 1, createdAt: 1 })
```

## Avoiding redundant indexes

DON'T create multiple single-field indexes when one compound index handles them:

```typescript
// ✗ BAD: Three separate indexes
@stringProp({ index: true })
public visibility!: string;

@booleanProp({ index: true })
public archived!: boolean;

@stringProp({ index: true })
public createdAt!: Date;

// ✓ GOOD: One compound index covers all
@index({ visibility: 1, archived: 1, createdAt: -1 })
```

## TTL indexes (automatic expiration)

For documents that should auto-delete after a time:

```typescript
import { index } from '@typegoose/typegoose';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
class SessionClass {
  @dateProp({ required: true })
  public expiresAt!: Date;
}
// Deletes when expiresAt time is reached
```
