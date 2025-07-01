// CreateAccountPage.jsx - Updated with verification flow
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, CircleX } from "lucide-react";
import GoogleIcon from "./GoogleIcon";
import Navbar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import useToast from "../hooks/useToast";

const CreateAccountPage = () => {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for focus and validation
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // Helper to validate email field
  const validateEmailField = (email) => {
    if (!email.trim()) return "Email address is required";
    if (!validateEmail(email)) return "Please enter a valid email address";
    return "";
  };

  // Helper to validate password field
  const validatePasswordField = (password) => {
    if (!password.trim()) return "Password is required";
    if (!validatePassword(password))
      return "Your password must contain between 8 or more characters.";
    return "";
  };

  // Handle email blur
  const handleEmailBlur = () => {
    setEmailFocused(false);
    setEmailError(validateEmailField(email));
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

  // Handle email focus
  const handleEmailFocus = () => {
    setEmailFocused(true);
    setEmailError("");
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

  // Handle form validation
  const handleFormValidation = () => {
    const emailErr = validateEmailField(email);
    const passwordErr = validatePasswordField(password);
    let confirmErr = "";

    if (!confirmPassword.trim()) {
      confirmErr = "Please confirm your password";
    } else if (confirmPassword !== password) {
      confirmErr = "Passwords do not match";
    }

    if (!termsAccepted) {
      setTermsError("You must accept the terms and conditions");
    } else {
      setTermsError("");
    }

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    return !emailErr && !passwordErr && !confirmErr && termsAccepted;
  };

  const handleFormAuthentication = async (e) => {
    e.preventDefault();
    if (handleFormValidation()) {
      setLoading(true);
      try {
        // Start timer and authentication simultaneously
        const [result] = await Promise.all([
          register(email, password),
          new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second delay
        ]);

        if (result.needsVerification) {
          toast.success(result.message);
          // Navigate to verification page
          navigate("/verify-email", { replace: true });
        } else {
          toast.success("Account created successfully!");
        }
      } catch (error) {
        // Handle API errors
        toast.error(error.message || "Failed to create account. Please try again.");
      } finally {
        setLoading(false);
      }
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

      {/* Login Form Container */}
      <section className="relative z-10 flex items-center justify-center pt-20 pb-4 mx-4 md:mx-0">
        <div
          className="w-full max-w-md rounded-md p-6 sm:p-12  
                backdrop-blur-lg
                border border-white/30
                shadow-lg ring-1 ring-inset ring-white/5 backdrop-brightness-75"
        >
          <h2 className="text-2xl font-bold text-white">Create Account</h2>

          {/* Form */}
          <form
            onSubmit={(e) => handleFormAuthentication(e)}
            className="space-y-4 mt-4"
          >
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                onFocus={handleEmailFocus}
                className={`w-full rounded bg-transparent border px-4 pt-6 pb-2 text-white placeholder-transparent focus:outline-1 focus:outline-white ${
                  emailError ? "border-red-500" : "border-white"
                }`}
              />

              <label
                className={`font-normal absolute left-4 pointer-events-none transition-all duration-200 ${
                  emailFocused || email
                    ? "text-xs top-1.5 text-gradient"
                    : "text-base top-4 transform -translate-y-0 text-white "
                }`}
              >
                Email Address
              </label>
              {emailError && (
                <p className="text-red-500 text-xs mt-2 flex items-center justify-start gap-1">
                <CircleX size={15} /> {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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
                    : "text-base top-4 transform -translate-y-0 text-white "
                }`}
              >
                Password
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
                placeholder="Confirm Password"
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
                    : "text-base top-4 transform -translate-y-0 text-white "
                }`}
              >
                Confirm Password
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

            {/* Terms Acceptance */}
            <div className="mt-4 flex items-start">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 form-checkbox h-4 w-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-white text-sm">
                I agree to the{" "}
                <a href="#" className="text-[#AB8BFF] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#AB8BFF] hover:underline">
                  Privacy Policy
                </a>
              </span>
            </div>
            {termsError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <CircleX size={15} /> {termsError}
              </p>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] py-3 font-bold  text-white px-4 hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={20} />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center text-gray-400">OR</div>

            {/* Social Login Buttons */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                className="flex flex-1 items-center cursor-pointer justify-center rounded bg-white/10 py-2.5 font-semibold text-white transition hover:bg-white/20"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                className="flex flex-1 items-center gap-2 justify-center cursor-pointer rounded bg-white/10 py-2.5 font-semibold text-white transition hover:bg-white/20"
              >
                <img
                  src="./github-logo.svg"
                  alt="github-logo"
                  width={20}
                  height={20}
                />
                GitHub
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="font-bold text-white hover:underline">
              Login In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CreateAccountPage;