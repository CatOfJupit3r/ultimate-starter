import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

const userThemeEnumwaii = new Enumwaii('UserTheme', ['LIGHT', 'DARK', 'SYSTEM']);
export const USER_THEME = userThemeEnumwaii.enum;
export const userThemeValidator = userThemeEnumwaii.schema.clone().catch(USER_THEME.DARK);

export type UserTheme = InferEnumwaii<typeof userThemeEnumwaii>;
export type AppTheme = typeof USER_THEME.LIGHT | typeof USER_THEME.DARK;

export const THEME_COOKIE = 'startername.theme';
