import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OfflineBadge } from '@/components/OfflineBadge'

// Pages
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import VerifyOtpPage from '@/pages/VerifyOtpPage'
import WelcomePage from '@/pages/WelcomePage'
import ProfileSetupPage from '@/pages/ProfileSetupPage'
import CustomerDashboard from '@/pages/customer/CustomerDashboard'
import BookingPage from '@/pages/customer/BookingPage'
import TrackingPage from '@/pages/customer/TrackingPage'
import DriverDashboard from '@/pages/driver/DriverDashboard'
import DriverActivePage from '@/pages/driver/DriverActivePage'

// Importer auto-sync
import { startAutoSync } from '@/lib/sync'

// Démarrer auto-sync au démarrage
if (typeof window !== 'undefined') {
  startAutoSync(30000) // Sync toutes les 30 secondes
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />

          {/* Customer routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:serviceType"
            element={
              <ProtectedRoute requiredRole="customer">
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track/:orderId"
            element={
              <ProtectedRoute requiredRole="customer">
                <TrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Driver routes */}
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/active/:orderId"
            element={
              <ProtectedRoute requiredRole="driver">
                <DriverActivePage />
              </ProtectedRoute>
            }
          />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>

        <OfflineBadge />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
