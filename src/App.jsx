// App.jsx - Updated with email verification route
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import LoginPage from "./components/LoginPage";
import CreateAccountPage from "./components/CreateAccountPage";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import EmailVerificationPage from "./components/EmailVerificationPage"; // Add this import
import EaziFlixSpinner from "./components/EaziFlixSpinner";
import { ToastProvider } from "./contexts/ToastProvider";

const AppRoutes = () => {
  const { current, loading } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return <EaziFlixSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          current ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={
          !current ? <LoginPage /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/createaccount"
        element={
          !current ? (
            <CreateAccountPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      {/* Add the email verification route */}
      <Route
        path="/verify-email"
        element={
          !current ? (
            <EmailVerificationPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={current ? <Dashboard /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;