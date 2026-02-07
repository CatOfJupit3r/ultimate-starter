/* eslint-disable max-classes-per-file */
import { getModelForClass, modelOptions } from '@typegoose/typegoose';

import { booleanProp, dateProp, objectIdProp, stringProp } from '../prop';

@modelOptions({ schemaOptions: { collection: 'user' } })
class UserClass {
  @objectIdProp({ required: true })
  public _id!: string;

  @stringProp({ required: true })
  public name!: string;

  @stringProp({ required: true, unique: true })
  public email!: string;

  @booleanProp({ required: true, default: false })
  public emailVerified!: boolean;

  @stringProp()
  public image?: string;

  @dateProp({ required: true })
  public createdAt!: Date;

  @dateProp({ required: true })
  public updatedAt!: Date;
}

@modelOptions({ schemaOptions: { collection: 'session' } })
class SessionClass {
  @objectIdProp({ required: true })
  public _id!: string;

  @dateProp({ required: true })
  public expiresAt!: Date;

  @stringProp({ required: true, unique: true })
  public token!: string;

  @dateProp({ required: true })
  public createdAt!: Date;

  @dateProp({ required: true })
  public updatedAt!: Date;

  @stringProp()
  public ipAddress?: string;

  @stringProp()
  public userAgent?: string;

  @stringProp({ required: true })
  public userId!: string;
}

@modelOptions({ schemaOptions: { collection: 'account' } })
class AccountClass {
  @objectIdProp({ required: true })
  public _id!: string;

  @stringProp({ required: true })
  public accountId!: string;

  @stringProp({ required: true })
  public providerId!: string;

  @stringProp({ required: true })
  public userId!: string;

  @stringProp()
  public accessToken?: string;

  @stringProp()
  public refreshToken?: string;

  @stringProp()
  public idToken?: string;

  @dateProp()
  public accessTokenExpiresAt?: Date;

  @dateProp()
  public refreshTokenExpiresAt?: Date;

  @stringProp()
  public scope?: string;

  @stringProp()
  public password?: string;

  @dateProp({ required: true })
  public createdAt!: Date;

  @dateProp({ required: true })
  public updatedAt!: Date;
}

@modelOptions({ schemaOptions: { collection: 'verification' } })
class VerificationClass {
  @objectIdProp({ required: true })
  public _id!: string;

  @stringProp({ required: true })
  public identifier!: string;

  @stringProp({ required: true })
  public value!: string;

  @dateProp({ required: true })
  public expiresAt!: Date;

  @dateProp()
  public createdAt?: Date;

  @dateProp()
  public updatedAt?: Date;
}

const User = getModelForClass(UserClass);
const Session = getModelForClass(SessionClass);
const Account = getModelForClass(AccountClass);
const Verification = getModelForClass(VerificationClass);

export { User, Session, Account, Verification };
