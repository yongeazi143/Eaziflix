import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, LoaderCircle, Mail, Eye, EyeOff } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import useToast from "../hooks/useToast";
import Navbar from "./Navbar";

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  // Form state for handling expired verification
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const navigate = useNavigate();
  const { 
    verifyEmail, 
    resendVerificationEmail, 
    canResendVerification,
    getResendTimeRemaining,
    resendVerificationWithCredentials,
    pendingVerificationEmail
  } = useUser();
  const { toast } = useToast();

  // Check if resend is available
  const canResend = canResendVerification ? canResendVerification() : false;

  // Get email from URL parameters if available
  const emailParam = searchParams.get("email");
  
  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    // If email is provided in URL, pre-fill it and show expired form
    if (emailParam) {
      setEmail(emailParam);
      setVerificationStatus("expired_form");
      return;
    }

    if (userId && secret) {
      // Auto-verify if URL contains verification parameters
      handleVerification(userId, secret);
    } else {
      // Show pending verification page
      setVerificationStatus("pending");
    }
  }, [searchParams]);

  // Cooldown timer effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Update cooldown based on remaining time
  useEffect(() => {
    if (pendingVerificationEmail && canResend) {
      const remainingTime = getResendTimeRemaining();
      if (remainingTime > 0) {
        setCooldown(Math.ceil(remainingTime / 1000));
      }
    }
  }, [pendingVerificationEmail, canResend, getResendTimeRemaining]);

  const handleVerification = async (userId, secret) => {
    try {
      const result = await verifyEmail(userId, secret);
      setVerificationStatus("success");
      setMessage(result.message);
      toast.success("Email verified successfully!");
      
      // Redirect to login after 3 seconds
      // setTimeout(() => {
      //   navigate("/login", { replace: true });
      // }, 3000);
    } catch (error) {
      setVerificationStatus("error");
      setMessage(error.message);
      toast.error(error.message);
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) {
      toast.error("Unable to resend verification email. Please try entering your credentials below.");
      return;
    }

    setResendLoading(true);
    try {
      const result = await resendVerificationEmail();
      toast.success(result.message);
      setCooldown(60); // Start 60-second cooldown
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes("expired") || error.message.includes("No pending verification")) {
        setVerificationStatus("expired_form");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleCredentialsResend = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setFormLoading(true);
    try {
      const result = await resendVerificationWithCredentials(email, password);
      toast.success(result.message);
      setVerificationStatus("pending");
      setCooldown(60);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const showExpiredForm = () => {
    setVerificationStatus("expired_form");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-purple-900/20 p-3 rounded-full w-fit">
              <LoaderCircle className="animate-spin text-purple-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
            <p className="text-gray-300">Please wait while we verify your email address.</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-green-900/20 p-3 rounded-full w-fit">
              <CheckCircle className="text-green-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <p className="text-sm text-gray-400">Redirecting you to login in 3 seconds...</p>
            <Link 
              to="/login" 
              className="inline-block mt-4 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
            >
              Go to Login
            </Link>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-red-900/20 p-3 rounded-full w-fit">
              <XCircle className="text-red-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            
            {message.includes("expired") && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-300 text-sm">
                  Your verification link has expired. Don't worry, you can get a new one!
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {canResend ? (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || cooldown > 0}
                  className="bg-gradient-to-r cursor-pointer from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="animate-spin" size={16} />
                      Sending...
                    </div>
                  ) : cooldown > 0 ? (
                    `Resend in ${formatTime(cooldown)}`
                  ) : (
                    "Resend Email"
                  )}
                </button>
              ) : (
                <button
                  onClick={showExpiredForm}
                  className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
                >
                  Enter Credentials
                </button>
              )}
              
              <Link 
                to="/createaccount" 
                className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition-all duration-300"
              >
                Register Again
              </Link>
              
              <Link 
                to="/login" 
                className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition-all duration-300 whitespace-nowrap"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      case "expired_form":
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-orange-900/20 p-3 rounded-full w-fit">
              <Mail className="text-orange-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Resend Verification</h2>
            <p className="text-gray-300 mb-4">
              Enter your email and password to send a new verification email.
            </p>
            
            <form onSubmit={handleCredentialsResend} className="space-y-4 mt-6">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded bg-transparent border border-white px-4 py-3 text-white placeholder-gray-400 focus:outline-1 focus:outline-white"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded bg-transparent border border-white px-4 py-3 text-white placeholder-gray-400 focus:outline-1 focus:outline-white pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-3 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin" size={16} />
                    Sending...
                  </div>
                ) : (
                  "Send Verification Email"
                )}
              </button>
            </form>

            <div className="flex flex-wrap gap-4 justify-center mt-6">
              <button
                onClick={() => setVerificationStatus("pending")}
                className="text-gray-400 hover:text-white underline"
              >
                Back
              </button>
              <Link 
                to="/login" 
                className="text-gray-400 hover:text-white underline"
              >
                Go to Login
              </Link>
            </div>
          </div>
        );

      case "pending":
      default:
        const remainingTime = canResend ? getResendTimeRemaining() : 0;
        const timeRemaining = Math.ceil(remainingTime / 1000);
        
        return (
          <div className="text-center">
            <div className="mx-auto mb-4 bg-purple-900/20 p-3 rounded-full w-fit">
              <Mail className="text-purple-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-300 mb-4">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Didn't receive the email? Check your spam folder or click the button below to resend.
            </p>
            
            {remainingTime > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-300 text-sm">
                  You can resend the email in: {formatTime(timeRemaining)}
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {canResend ? (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || cooldown > 0}
                  className="bg-gradient-to-r cursor-pointer from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="animate-spin" size={16} />
                      Sending...
                    </div>
                  ) : cooldown > 0 ? (
                    `Resend in ${formatTime(cooldown)}`
                  ) : (
                    "Resend Email"
                  )}
                </button>
              ) : (
                <button
                  onClick={showExpiredForm}
                  className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
                >
                  Enter Credentials to Resend
                </button>
              )}
              
              <Link 
                to="/login" 
                className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition-all duration-300 whitespace-nowrap"
              >
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

export default EmailVerificationPage;
