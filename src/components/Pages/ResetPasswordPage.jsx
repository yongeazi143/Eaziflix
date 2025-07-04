import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, CircleX, CheckCircle, XCircle, KeyRound } from "lucide-react";
import Navbar from "../Navbar";
import { useUser } from "../../contexts/UserContext";
import useToast from "../../hooks/useToast";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [resetStatus, setResetStatus] = useState("form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const { resetPassword } = useUser();
  const { toast } = useToast();

  // Get URL parameters
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  // Password validation function
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  // Helper to validate password field
  const validatePasswordField = (password) => {
    if (!password.trim()) return "Password is required";
    if (!validatePassword(password))
      return "Password must be 8+ chars, with upper, lower, number & symbol.";
    return "";
  };

  // Handle password blur
  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    setPasswordError(validatePasswordField(password));
  };

  // Handle confirm password blur
  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordFocused(false);
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  // Handle password focus
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    setPasswordError("");
  };

  // Handle confirm password focus
  const handleConfirmPasswordFocus = () => {
    setConfirmPasswordFocused(true);
    setConfirmPasswordError("");
  };

  // Check if required parameters are present
  useEffect(() => {
    if (!userId || !secret) {
      setResetStatus("invalid_link");
      setMessage("Invalid reset link. Please request a new password reset.");
    }
  }, [userId, secret]);

  // Handle form validation
  const handleFormValidation = () => {
    const passwordErr = validatePasswordField(password);
    let confirmErr = "";

    if (!confirmPassword.trim()) {
      confirmErr = "Please confirm your password";
    } else if (confirmPassword !== password) {
      confirmErr = "Passwords do not match";
    }

    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    return !passwordErr && !confirmErr;
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!handleFormValidation()) return;

    setLoading(true);
    try {
      const result = await resetPassword(userId, secret, password);
      setResetStatus("success");
      setMessage(result.message);
      toast.success("Password reset successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (error) {
      toast.error(error.message || "Failed to reset password. Please try again.");
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        setResetStatus("invalid_link");
        setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (resetStatus) {
      case "success":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-green-900/20 p-3 rounded-full w-fit">
              <CheckCircle className="text-green-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <p className="text-sm text-gray-400 mb-4">You can now log in with your new password.</p>
            <p className="text-sm text-gray-400">Redirecting to login in 3 seconds...</p>
            <Link 
              to="/login" 
              className="inline-block mt-4 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
            >
              Go to Login
            </Link>
          </div>
        );

      case "invalid_link":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-red-900/20 p-3 rounded-full w-fit">
              <XCircle className="text-red-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 text-sm">
                Reset links expire after a certain time for security reasons. You can request a new one below.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              <Link 
                to="/forget-password" 
                className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
              >
                Request New Reset Link
              </Link>
              
              <Link 
                to="/login" 
                className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition-all duration-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      case "form":
      default:
        return (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 bg-purple-900/20 p-3 rounded-full w-fit">
                <KeyRound className="text-purple-400" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
              <p className="text-gray-300">
                Please enter a new password for your account.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  className={`w-full rounded bg-transparent placeholder-transparent px-4 pt-6 pb-2 border text-white focus:outline-1 focus:outline-white transition-all duration-200 ${
                    passwordError ? "border-red-500" : "border-white"
                  }`}
                />
                <label
                  className={`font-normal absolute left-4 pointer-events-none transition-all duration-200 ${
                    passwordFocused || password
                      ? "text-xs top-1.5 text-gradient"
                      : "text-base top-4 transform -translate-y-0 text-white"
                  }`}
                >
                  New Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-5 text-gray-400 hover:text-white hover:cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                
                {passwordError && (
                  <p className="text-red-500 text-xs mt-2 flex items-center justify-start gap-1">
                    <CircleX size={15} /> {passwordError}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={handleConfirmPasswordFocus}
                  onBlur={handleConfirmPasswordBlur}
                  className={`w-full rounded bg-transparent placeholder-transparent px-4 pt-6 pb-2 border text-white focus:outline-1 focus:outline-white transition-all duration-200 ${
                    confirmPasswordError ? "border-red-500" : "border-white"
                  }`}
                />
                <label
                  className={`font-normal absolute left-4 pointer-events-none transition-all duration-200 ${
                    confirmPasswordFocused || confirmPassword
                      ? "text-xs top-1.5 text-gradient"
                      : "text-base top-4 transform -translate-y-0 text-white"
                  }`}
                >
                  Confirm New Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-5 text-gray-400 hover:text-white hover:cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                
                {confirmPasswordError && (
                  <p className="text-red-500 text-xs mt-2 flex items-center justify-start gap-1">
                    <CircleX size={15} /> {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm font-medium mb-2">Password Requirements:</p>
                <ul className="text-blue-300 text-xs space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character</li>
                </ul>
              </div>

              {/* Reset Password Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] py-3 font-bold text-white px-4 hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin" size={20} />
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="text-center mt-6">
              <span className="text-gray-400">Remember your password? </span>
              <Link to="/login" className="font-bold text-white hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('./login-bg.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/70 z-0"></div>
      <Navbar />

      <section className="relative z-10 flex items-center justify-center pt-20 pb-5 mx-4 md:mx-0">
        <div className="w-full max-w-md rounded-md p-6 sm:p-12 backdrop-blur-lg border border-white/30 shadow-lg ring-1 ring-inset ring-white/5 backdrop-brightness-75">
          {renderContent()}
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;