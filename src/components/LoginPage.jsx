import { useState } from "react";

import { Eye, EyeOff} from "lucide-react";
import GoogleIcon from "./GoogleIcon";
import Navbar from "./Navbar";
import CancelIcon from "./CancelIcon";

// Main App component
const LoginPage = () => {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // State for focus and validation
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    return password.length >= 6;
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
      return "Your password must contain between 6 or more characters.";
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

  // Handle email focus
  const handleEmailFocus = () => {
    setEmailFocused(true);
    setEmailError(""); // Clear error on focus
  };

  // Handle password focus
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    setPasswordError(""); // Clear error on focus
  };

  // Handle login authentication
  const handleFormValidation = () => {
    const emailErr = validateEmailField(email);
    const passwordErr = validatePasswordField(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    return !emailErr && !passwordErr;
  };

  const handleFormAuthentication = async (e) => {
    e.preventDefault();
    if (handleFormValidation()) {
      setLoading(true);
      try {
        // Call authentication API
        console.log("Form submitted with:", { email, password, rememberMe });
        // Redirect on success
      } catch (error) {
        // Handle API errors
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
      <section className="relative z-10 flex items-center justify-center pt-20">
        <div
          className="w-full max-w-md rounded-md p-8 sm:p-12 
                bg-black/10 
                backdrop-blur-lg 
                border border-white/10 
                shadow-lg ring-1 ring-inset ring-white/5 backdrop-brightness-75"
        >
          <h2>Sign In</h2>

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
                <p className="text-red-500 mt-2 flex items-center justify-start gap-1">
                  <CancelIcon /> {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
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
                <p className="text-red-500 mt-2 flex items-center justify-start gap-1">
                  <CancelIcon /> {passwordError}
                </p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full rounded bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] py-3 font-bold  text-white px-4 hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
            >
              Sign In
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
                <img src="./github-logo.svg" alt="github-logo" width={20} height={20} />
                GitHub
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="#" className="text-sm text-gray-400 hover:underline">
                Forgot password?
              </a>
            </div>
          </form>

          {/* Remember Me Checkbox */}
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-checkbox h-4 w-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
            />
            <span className="ml-2 text-white">Remember me</span>
          </label>

          {/* Sign Up Section */}
          <div className="text-gray-400 mt-4">
            New to Eazi<span className="text-gradient">Flix?</span>
            {"  "}
            <a href="#" className="font-bold text-white hover:underline">
              Sign up now
            </a>
            .
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
