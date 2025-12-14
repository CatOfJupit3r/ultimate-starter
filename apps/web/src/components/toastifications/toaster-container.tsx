import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { USER_THEME, useTheme } from '../theme-provider';

export default function ToasterContainer() {
  const { appTheme } = useTheme();

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={appTheme === USER_THEME.dark ? 'dark' : 'light'}
    />
  );
}
