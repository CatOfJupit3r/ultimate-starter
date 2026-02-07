# Property Decorators Reference

This project uses custom property decorators defined in `apps/server/src/db/prop.ts` to simplify Typegoose model definitions and provide better type inference.

## Why custom decorators?

Typegoose requires explicit `type: () => Type` declarations for proper TypeScript inference. Without this, TypeScript cannot infer the correct types for model properties.

### The problem with raw @prop

```typescript
// ❌ BAD: TypeScript cannot infer the type
@prop()
public name!: string;  // Type is 'any' at runtime

// ✅ GOOD: But verbose
@prop({ type: () => String })
public name!: string;  // Type is correctly inferred
```

### The solution: Typed decorators

```typescript
// ✅ BEST: Clean and type-safe
@stringProp()
public name!: string;  // Type is correctly inferred, less boilerplate
```

## Available decorators

### `@objectIdProp(options?)`

Automatically generates MongoDB ObjectId strings for `_id` fields.

```typescript
@objectIdProp()
public _id!: string;

// With options
@objectIdProp({ required: true })
public _id!: string;
```

**Equivalent to:**
```typescript
@prop({ type: () => String, default: () => ObjectIdString() })
public _id!: string;
```

### `@stringProp(options?)`

For string fields.

```typescript
@stringProp({ required: true })
public name!: string;

@stringProp({ default: '', maxlength: 500 })
public bio!: string;

@stringProp({ required: true, unique: true, index: true })
public email!: string;
```

**Equivalent to:**
```typescript
@prop({ type: String, required: true })
public name!: string;
```

### `@numberProp(options?)`

For number fields.

```typescript
@numberProp({ required: true })
public age!: number;

@numberProp({ default: 0, min: 0 })
public score!: number;
```

**Equivalent to:**
```typescript
@prop({ type: Number, required: true })
public age!: number;
```

### `@booleanProp(options?)`

For boolean fields.

```typescript
@booleanProp({ default: false })
public archived!: boolean;

@booleanProp({ required: true })
public isActive!: boolean;
```

**Equivalent to:**
```typescript
@prop({ type: Boolean, default: false })
public archived!: boolean;
```

### `@dateProp(options?)`

For Date fields.

```typescript
@dateProp({ required: true })
public unlockedAt!: Date;

@dateProp({ default: () => new Date() })
public lastSeen!: Date;
```

**Equivalent to:**
```typescript
@prop({ type: Date, required: true })
public unlockedAt!: Date;
```

### `@stringArrayProp(options?)`

For arrays of strings.

```typescript
@stringArrayProp({ default: [] })
public tags!: string[];

@stringArrayProp({ required: true })
public roles!: string[];
```

**Equivalent to:**
```typescript
@prop({ type: () => [String], default: [] })
public tags!: string[];
```

### `@numberArrayProp(options?)` and `@booleanArrayProp(options?)`

For arrays of numbers or booleans.

```typescript
@numberArrayProp({ default: [] })
public scores!: number[];

@booleanArrayProp({ default: [] })
public flags!: boolean[];
```

### `@arrayProp(itemType, options?)`

For arrays of embedded documents.

```typescript
class StepClass {
  @objectIdProp()
  public _id!: string;

  @stringProp({ required: true })
  public title!: string;
}

@arrayProp(StepClass, { default: [] })
public steps!: StepClass[];
```

**Equivalent to:**
```typescript
@prop({ type: () => [StepClass], default: [] })
public steps!: StepClass[];
```

### `@objectProp(objectType, options?)`

For nested/embedded documents.

```typescript
class AddressClass {
  @stringProp({ required: true })
  public street!: string;
}

@objectProp(AddressClass)
public address?: AddressClass;
```

**Equivalent to:**
```typescript
@prop({ type: () => AddressClass })
public address?: AddressClass;
```

## Common options

All decorators accept standard Typegoose options (except `type` and `default` which are handled by the decorator):

- `required: boolean` - Field must be present
- `default: any | () => any` - Default value (function for complex values)
- `index: boolean` - Create a single-field index
- `unique: boolean` - Enforce uniqueness
- `enum: any[]` - Restrict to specific values
- `minlength: number` - Minimum string length
- `maxlength: number` - Maximum string length
- `min: number` - Minimum number value
- `max: number` - Maximum number value

## When to use raw @prop

Use the raw `@prop` decorator only for:

1. **Mixed/dynamic data** (with `allowMixed: Severity.ALLOW`)
```typescript
import { prop, Severity } from '@typegoose/typegoose';

@prop({ type: () => Object, allowMixed: Severity.ALLOW })
public data?: Record<string, unknown>;
```

2. **Special Typegoose features** not supported by helpers (rare)

For 99% of cases, use the typed decorators for better developer experience and type safety.
