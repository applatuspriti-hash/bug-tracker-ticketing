import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import NavigationScroll from 'layout/NavigationScroll';

import ThemeCustomization from 'themes';

// auth provider
import { AuthProvider } from 'contexts/AuthContext';
import { DataProvider } from 'contexts/DataContext';
import { ToastProvider } from 'contexts/ToastContext';

// ==============================|| APP ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <AuthProvider>
        <ToastProvider>
          <DataProvider>
            <NavigationScroll>
              <>
                <RouterProvider router={router} />
              </>
            </NavigationScroll>
          </DataProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeCustomization>
  );
}
