import { em } from 'enumwaii';
import { emToZodSchema } from 'enumwaii/zod';

const userThemeEnumwaii = em(['LIGHT', 'DARK', 'SYSTEM']);
export const USER_THEME = userThemeEnumwaii.enum;
export const userThemeValidator = emToZodSchema(userThemeEnumwaii).catch(USER_THEME.DARK);

export type UserTheme = (typeof userThemeEnumwaii)['~type'];
export type AppTheme = typeof USER_THEME.LIGHT | typeof USER_THEME.DARK;

export const THEME_COOKIE = 'startername.theme';
