import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { AlertCircle } from "lucide-react";
import useToast from "../../hooks/useToast";

const OAuthFailure = () => {
  const { handleOAuthFailure } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      handleOAuthFailure();
    } catch (error) {
      toast.error(error.message || "Social login failed. Please try again.");
    }
    
    // Redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sign In Failed
        </h2>
        <p className="text-gray-600 mb-4">
          We couldn't complete your social login. This might be because you cancelled the process or there was an issue with the authentication provider.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting you back to the login page...
        </p>
      </div>
    </div>
  );
};

export default OAuthFailure;