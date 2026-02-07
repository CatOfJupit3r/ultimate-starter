import { getModelForClass, modelOptions } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { BadgeId } from '@startername/shared/constants/badges';

import { generatePublicCode } from '../helpers';
import { objectIdProp, stringProp } from '../prop';

@modelOptions({ schemaOptions: { collection: 'profile', timestamps: true } })
class UserProfileClass {
  @objectIdProp({ required: true })
  public _id!: string;

  @stringProp({ required: true, unique: true, index: true })
  public userId!: string;

  @stringProp({ default: () => '', maxlength: 500 })
  public bio!: string;

  @stringProp({ type: String, default: null })
  public selectedBadge?: BadgeId | null;

  @stringProp({ required: true, unique: true, index: true, default: () => generatePublicCode() })
  public publicCode!: string;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const UserProfileModel = getModelForClass(UserProfileClass);
export type UserProfileDoc = DocumentType<UserProfileClass>;
