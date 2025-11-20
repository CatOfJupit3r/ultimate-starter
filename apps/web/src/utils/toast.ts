import type { ToastOptions } from 'react-toastify';
import { toast as reactToast } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toast = {
  success: (message: string, options?: ToastOptions) => reactToast.success(message, { ...defaultOptions, ...options }),
  error: (message: string, options?: ToastOptions) => reactToast.error(message, { ...defaultOptions, ...options }),
  info: (message: string, options?: ToastOptions) => reactToast.info(message, { ...defaultOptions, ...options }),
  warning: (message: string, options?: ToastOptions) => reactToast.warning(message, { ...defaultOptions, ...options }),
  default: (message: string, options?: ToastOptions) => reactToast(message, { ...defaultOptions, ...options }),
};
