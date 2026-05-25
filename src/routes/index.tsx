import { createBrowserRouter, Navigate } from 'react-router';

import App from '@/App.tsx';
import AdminPage from '@/routes/admin.tsx';
import ChatPage from '@/routes/chat.tsx';
import RecipesPage from '@/routes/recipes.tsx';
import ReportsPage from '@/routes/reports.tsx';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <ChatPage /> },
      { path: 'admin', element: <Navigate to="/admin/recipes" replace /> },
      { path: 'admin/recipes', element: <AdminPage /> },
      { path: 'admin/user-recipes', element: <RecipesPage /> },
      { path: 'admin/user-recipe-reports', element: <ReportsPage /> },
      { path: 'recipes', element: <RecipesPage /> },
    ],
  },
]);
