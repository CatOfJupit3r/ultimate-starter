import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

const userThemeEnumwaii = new Enumwaii('UserTheme', ['light', 'dark', 'system']);
export const USER_THEME = userThemeEnumwaii.enum;
export const userThemeValidator = userThemeEnumwaii.schema.clone().catch(USER_THEME.dark);

export type UserTheme = InferEnumwaii<typeof userThemeEnumwaii>;
export type AppTheme = typeof USER_THEME.light | typeof USER_THEME.dark;

export const THEME_COOKIE = 'startername.theme';
