import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './components/contexts/AppContext';
import UserRoutes from './components/routes/UserRoutes';
import AdminRoutes from './components/routes/AdminRoutes';
import Login from './components/pages/auth/Login';
import Register from './components/pages/auth/Register';

const App = () => {
  const { user,loading } = useAppContext();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />} />
        <Route
          path="/admin/*"
          element={user && user.role === 'admin' ? <AdminRoutes /> : <Navigate to="/login" />}
        />
        <Route
          path="/*"
          element={user && user.role !== 'admin' ? <UserRoutes /> : <Navigate to="/login" />}
        />
        <Route
          path="*"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;