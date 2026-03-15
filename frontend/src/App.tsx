import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Generate from './pages/Generate';
import History from './pages/History';
import Visualization from './pages/Visualization';
import Login from './pages/login';
import Signup from './pages/signup';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import HomeRedirect from './components/HomeRedirect';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Home route - redirects based on auth state */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Public routes - only accessible when NOT logged in */}
            <Route 
              path="/home" 
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes - only accessible when logged in */}
            <Route 
              path="/generate" 
              element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/visualization" 
              element={
                <ProtectedRoute>
                  <Visualization />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/visualization/:id" 
              element={
                <ProtectedRoute>
                  <Visualization />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
