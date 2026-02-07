import { prop } from '@typegoose/typegoose';
import type { BasePropOptions } from '@typegoose/typegoose/lib/types';

import { ObjectIdString } from './helpers';

type PropOptionsWithoutType = BasePropOptions;

/**
 * ObjectId string property decorator
 * @param options - Typegoose prop options (excluding default)
 */
export function objectIdProp(options: Omit<PropOptionsWithoutType, 'default'> = {}) {
  return prop({ type: () => String, default: () => ObjectIdString(), ...options });
}

/**
 * String property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function stringProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: String });
}

/**
 * Number property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function numberProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: Number });
}

/**
 * Boolean property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function booleanProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: Boolean });
}

/**
 * Date property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function dateProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: Date });
}

/**
 * Array of strings property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function stringArrayProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: () => [String] });
}

/**
 * Array of numbers property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function numberArrayProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: () => [Number] });
}

/**
 * Array of booleans property decorator
 * @param options - Typegoose prop options (excluding type)
 */
export function booleanArrayProp(options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: () => [Boolean] });
}

/**
 * Generic array property decorator
 * @param itemType - The type of items in the array (class or primitive)
 * @param options - Typegoose prop options (excluding type)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayProp<T = any>(itemType: T, options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: () => [itemType] });
}

/**
 * Object/subdocument property decorator
 * @param objectType - The class type for the subdocument
 * @param options - Typegoose prop options (excluding type)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function objectProp<T = any>(objectType: T, options: PropOptionsWithoutType = {}) {
  return prop({ ...options, type: () => objectType });
}
