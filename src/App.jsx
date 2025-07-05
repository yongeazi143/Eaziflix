import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Pages
import LoginPage from "./components/Pages/LoginPage";
import CreateAccountPage from "./components/Pages/CreateAccountPage";
import Dashboard from "./components/Pages/Dashboard";
import LandingPage from "./components/Pages/LandingPage";
import EmailVerificationPage from "./components/Pages/EmailVerificationPage";
import ForgotPasswordPage from "./components/Pages/ForgotPasswordPage";

// Eaziflix Page Loader
import EaziFlixSpinner from "./components/EaziFlixSpinner";

// User Context for User Authentication / Notification Contexr
import { UserProvider, useUser } from "./contexts/UserContext";
import { ToastProvider } from "./contexts/ToastProvider";
import ResetPasswordPage from "./components/Pages/ResetPasswordPage";
import OAuthSuccess from "./components/Pages/OAuthSuccess";
import OAuthFailure from "./components/Pages/OAuthFailure";
import MovieDetailsPage from "./components/Pages/MovieDetailsPage";

const AppRoutes = () => {
  const { current, loading } = useUser();
  const location = useLocation();

  if (location.pathname === "/oauth-success") {
    return <OAuthSuccess />;
  }
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
        element={current ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/forget-password"
        element={
          !current ? (
            <ForgotPasswordPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/reset-password"
        element={
          !current ? (
            <ResetPasswordPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/oauth-failure"
        element={
          !current ? <OAuthFailure /> : <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/movie/:id/*"
        element={
          current ? <MovieDetailsPage /> : <Navigate to="/" replace />
        }
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
