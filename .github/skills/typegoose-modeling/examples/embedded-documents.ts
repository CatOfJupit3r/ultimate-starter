// Example: Typegoose model with embedded documents
// Location: apps/server/src/db/models/embedded-example.model.ts

import { getModelForClass, modelOptions } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import { objectIdProp, stringProp, numberProp, dateProp, arrayProp, objectProp } from '../prop';

// Embedded document class for a single address
class AddressClass {
  @stringProp({ required: true })
  public street!: string;

  @stringProp({ required: true })
  public city!: string;

  @stringProp({ required: true })
  public zipCode!: string;

  @stringProp()
  public country?: string;
}

// Embedded document class for order items
class OrderItemClass {
  @objectIdProp()
  public _id!: string;

  @stringProp({ required: true })
  public productId!: string;

  @stringProp({ required: true })
  public name!: string;

  @numberProp({ required: true, min: 1 })
  public quantity!: number;

  @numberProp({ required: true, min: 0 })
  public price!: number;
}

// Embedded document class for member info
class MemberClass {
  @stringProp({ required: true })
  public userId!: string;

  @stringProp({ required: true, enum: ['ADMIN', 'MEMBER', 'GUEST'] })
  public role!: 'ADMIN' | 'MEMBER' | 'GUEST';

  @dateProp({ default: () => new Date() })
  public joinedAt!: Date;
}

@modelOptions({
  schemaOptions: {
    collection: 'embedded_examples',
    timestamps: true,
  },
})
class EmbeddedExampleClass {
  @objectIdProp()
  public _id!: string;

  @stringProp({ required: true })
  public name!: string;

  // Single embedded document (optional)
  @objectProp(AddressClass)
  public primaryAddress?: AddressClass;

  // Array of embedded documents
  @arrayProp(AddressClass, { default: [] })
  public addresses!: AddressClass[];

  // Array of embedded documents with IDs
  @arrayProp(OrderItemClass, { default: [] })
  public items!: OrderItemClass[];

  // Array of embedded documents for team members
  @arrayProp(MemberClass, { default: [] })
  public members!: MemberClass[];

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const EmbeddedExampleModel = getModelForClass(EmbeddedExampleClass);
export type EmbeddedExampleDoc = DocumentType<EmbeddedExampleClass>;

// Usage example:
// const doc = await EmbeddedExampleModel.create({
//   _id: ObjectIdString(),
//   name: 'Example',
//   primaryAddress: {
//     street: '123 Main St',
//     city: 'Springfield',
//     zipCode: '12345',
//   },
//   items: [
//     {
//       _id: ObjectIdString(),
//       productId: 'prod_123',
//       name: 'Widget',
//       quantity: 2,
//       price: 19.99,
//     },
//   ],
//   members: [
//     {
//       userId: 'user_123',
//       role: 'ADMIN',
//       joinedAt: new Date(),
//     },
//   ],
// });
