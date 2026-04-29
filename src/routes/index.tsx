import { createBrowserRouter } from 'react-router';

import App from '@/App.tsx';
import AdminPage from '@/routes/admin.tsx';
import ChatPage from '@/routes/chat.tsx';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <ChatPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
