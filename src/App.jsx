import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css'
import AppLayout from './layouts/app_layout.jsx';
import LandingPage from './pages/landing_page.jsx';
import Auth from './pages/auth.jsx';
import Dashboard from './pages/dashboard.jsx';
import Link from './pages/link.jsx';
import BioPages from './pages/bio_pages.jsx';
import Bio from './pages/bio.jsx';
import Redirect from './pages/redirect.jsx';
import ForgotPasswordPage from './pages/forgot-password.jsx';
import ResetPasswordPage from './pages/reset-password.jsx';
import Profile from './pages/profile.jsx';
import Admin from './pages/admin.jsx';
import React from 'react';
import UrlProvider from './context.jsx';
import RequireAuth from './components/require-auth.jsx';

const router=createBrowserRouter([
  {
    element:<AppLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage/>
      },
      {
        path: '/auth',
        element: <Auth/>
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage/>
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage/>
      },
      {
        path: '/dashboard',
        element:<RequireAuth><Dashboard/></RequireAuth>
      },
      {
        path: '/profile',
        element: <RequireAuth><Profile/></RequireAuth>
      },
      {
        path: '/link/:id',
        element: <RequireAuth><Link/></RequireAuth>
      },
      {
        path: '/bio_pages',
        element: <RequireAuth><BioPages/></RequireAuth>
      },
      {
        path: '/admin',
        element: <RequireAuth><Admin/></RequireAuth>
      },
      {
        path: '/bio/:id',
        element: <Bio/>
      },
      {
        path: '/:id/:shortUrl',
        element: <Redirect/>
      }
    ]
  }
])
function App() {
return <UrlProvider>
  <RouterProvider router={router} />
</UrlProvider>
}

export default App
