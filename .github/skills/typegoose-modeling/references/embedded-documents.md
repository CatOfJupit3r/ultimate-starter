# Embedded Documents & Nested Objects

Create reusable nested structures with `@objectProp` and `@arrayProp` decorators.

## Single nested object

Use `@objectProp(Class)` for single nested objects:

```typescript
class AddressClass {
  @stringProp({ required: true })
  public street!: string;

  @stringProp({ required: true })
  public city!: string;

  @stringProp({ required: true })
  public zipCode!: string;
}

@modelOptions({ schemaOptions: { collection: 'users' } })
class UserClass {
  @objectIdProp()
  public _id!: string;

  @objectProp(AddressClass)
  public homeAddress?: AddressClass;  // Optional single object

  @objectProp(AddressClass)
  public workAddress!: AddressClass;  // Required single object
}
```

## Array of embedded documents

Use `@arrayProp(Class, options)` for arrays:

```typescript
class AddressClass {
  @stringProp({ required: true })
  public street!: string;
}

class UserClass {
  @arrayProp(AddressClass, { default: [] })
  public addresses!: AddressClass[];  // Always typed and initialized
}
```

## Accessing nested fields

TypeScript fully infers nested types:

```typescript
const user = await UserModel.findById(userId);

// TypeScript knows these are typed
user.homeAddress?.city        // string | undefined
user.addresses[0].street      // string
user.addresses.map(a => a.city)  // string[]
```

## Arrays of primitives

Use dedicated decorators for primitive arrays:

```typescript
// String array
@stringArrayProp({ default: [] })
public tags!: string[];

// Number array
@numberArrayProp({ default: [] })
public scores!: number[];
```

## Deeply nested structures

Nest as many levels as needed:

```typescript
class PhoneClass {
  @stringProp({ required: true })
  public number!: string;

  @stringProp({ enum: ['MOBILE', 'HOME', 'WORK'], default: 'MOBILE' })
  public type!: string;
}

class ContactClass {
  @stringProp({ required: true })
  public email!: string;

  @arrayProp(PhoneClass, { default: [] })
  public phones!: PhoneClass[];
}

class UserClass {
  @objectProp(ContactClass)
  public contact!: ContactClass;  // contact.phones[0].number access
}
```

## Optional vs required nested

```typescript
// Optional (may not exist)
@objectProp(MetadataClass)
public metadata?: MetadataClass;

// Required but can be null
@objectProp(MetadataClass, { default: null })
public metadata!: MetadataClass | null;

// Required, always present
@objectProp(MetadataClass, { default: () => new MetadataClass() })
public metadata!: MetadataClass;
```

## Shared schema fragments

Reuse nested structures across multiple models:

```typescript
// In apps/server/src/db/schemas/common.ts
export class GeoPointClass {
  @numberProp({ required: true })
  public latitude!: number;

  @numberProp({ required: true })
  public longitude!: number;
}

// In models
class VenueClass {
  @objectProp(GeoPointClass)
  public location!: GeoPointClass;
}

class EventClass {
  @objectProp(GeoPointClass)
  public coordinates!: GeoPointClass;
}
```
