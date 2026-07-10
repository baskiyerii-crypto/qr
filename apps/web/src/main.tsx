import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';
import { useSidebarStore } from './stores/sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

useAuthStore.getState().loadFromStorage();
useThemeStore.getState().init();
useSidebarStore.getState().init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
