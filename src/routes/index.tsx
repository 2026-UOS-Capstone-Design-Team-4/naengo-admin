import { createBrowserRouter, Navigate } from 'react-router';

import App from '@/App.tsx';
import AdminPage from '@/routes/admin.tsx';
import ChatPage from '@/routes/chat.tsx';
import LoginPage from '@/routes/login.tsx';
import RecipesPage from '@/routes/recipes.tsx';
import ReportsPage from '@/routes/reports.tsx';
import RequireAuth from '@/routes/RequireAuth.tsx';
import SignupPage from '@/routes/signup.tsx';

export const router = createBrowserRouter([
  { path: 'login', element: <LoginPage /> },
  { path: 'signup', element: <SignupPage /> },
  {
    element: <RequireAuth />,
    children: [
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
    ],
  },
]);
