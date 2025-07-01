// EmailVerificationPage.jsx - Updated to handle unavailable resend
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, LoaderCircle, Mail } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import useToast from "../hooks/useToast";
import Navbar from "./Navbar";

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error, pending
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail, canResendVerification } = useUser();
  const { toast } = useToast();

  // Check if resend is available (for Solution 1, use pendingVerificationEmail; for Solution 2, use canResendVerification)
  const canResend = canResendVerification ? canResendVerification() : false;

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

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

  const handleVerification = async (userId, secret) => {
    try {
      const result = await verifyEmail(userId, secret);
      setVerificationStatus("success");
      setMessage(result.message);
      toast.success("Email verified successfully!");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (error) {
      setVerificationStatus("error");
      setMessage(error.message);
      toast.error(error.message);
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) {
      toast.error("Unable to resend verification email. Please try registering again.");
      return;
    }

    setResendLoading(true);
    try {
      const result = await resendVerificationEmail();
      toast.success(result.message);
      setCooldown(60); // Start 60-second cooldown
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
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
                    `Resend in ${cooldown}s`
                  ) : (
                    "Resend Email"
                  )}
                </button>
              ) : (
                <Link 
                  to="/createaccount" 
                  className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
                >
                  Register Again
                </Link>
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

      case "pending":
      default:
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
                    `Resend in ${cooldown}s`
                  ) : (
                    "Resend Email"
                  )}
                </button>
              ) : (
                  <Link 
                    to="/createaccount" 
                    className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white px-6 py-2 rounded font-semibold hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
                  >
                    Register Again
                  </Link>
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