// Example: Basic Typegoose model with typed decorators
// Location: apps/server/src/db/models/example.model.ts

import { getModelForClass, modelOptions } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import { objectIdProp, stringProp, booleanProp, dateProp } from '../prop';

@modelOptions({
  schemaOptions: {
    collection: 'examples',
    timestamps: true,
  },
})
class ExampleClass {
  // ObjectId field with auto-generation
  @objectIdProp()
  public _id!: string;

  // Required string field
  @stringProp({ required: true })
  public name!: string;

  // String field with index
  @stringProp({ required: true, index: true })
  public ownerId!: string;

  // Optional string field with max length
  @stringProp({ maxlength: 500 })
  public description?: string;

  // Boolean field with default
  @booleanProp({ default: false })
  public archived!: boolean;

  // Date field
  @dateProp({ default: () => new Date() })
  public lastModified!: Date;

  // Timestamps (added by Mongoose automatically)
  public createdAt!: Date;
  public updatedAt!: Date;
}

// Export the model and type
export const ExampleModel = getModelForClass(ExampleClass);
export type ExampleDoc = DocumentType<ExampleClass>;
