import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, LoaderCircle, CircleX, CheckCircle } from "lucide-react";
import Navbar from "../Navbar";
import { useUser } from "../../contexts/UserContext";
import useToast from "../../hooks/useToast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { requestPasswordReset } = useUser();
  const { toast } = useToast();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Helper to validate email field
  const validateEmailField = (email) => {
    if (!email.trim()) return "Email address is required";
    if (!validateEmail(email)) return "Please enter a valid email address";
    return "";
  };

  // Handle email blur
  const handleEmailBlur = () => {
    setEmailFocused(false);
    setEmailError(validateEmailField(email));
  };

  // Handle email focus
  const handleEmailFocus = () => {
    setEmailFocused(true);
    setEmailError("");
  };

  // Handle form submission
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    const emailErr = validateEmailField(email);
    setEmailError(emailErr);
    
    if (emailErr) return;

    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setEmailSent(true);
      toast.success(result.message);
      startCooldown();
    } catch (error) {
      toast.error(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      toast.success("Password reset email sent again!");
      startCooldown();
    } catch (error) {
      toast.error(error.message || "Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Start cooldown timer
  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (emailSent) {
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
            <div className="text-center">
              <div className="mx-auto mb-4 bg-green-900/20 p-3 rounded-full w-fit">
                <CheckCircle className="text-green-400" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-300 mb-4">
                We've sent a password reset link to <span className="font-semibold text-white">{email}</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Please check your inbox and click the link to reset your password. Don't forget to check your spam folder!
              </p>

              {resendCooldown > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-sm">
                    You can resend the email in: {formatTime(resendCooldown)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="animate-spin" size={16} />
                      Sending...
                    </div>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${formatTime(resendCooldown)}`
                  ) : (
                    "Resend Email"
                  )}
                </button>
                
                <Link 
                  to="/login" 
                  className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition-all duration-300"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

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
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 bg-purple-900/20 p-3 rounded-full w-fit">
              <Mail className="text-purple-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
            <p className="text-gray-300">
              Don't worry! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
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
                    : "text-base top-4 transform -translate-y-0 text-white"
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

            {/* Send Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] py-3 font-bold text-white px-4 hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={20} />
                  <span>Sending Reset Link...</span>
                </div>
              ) : (
                "Send Reset Link"
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
      </section>
    </main>
  );
};

export default ForgotPasswordPage;