import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { LoaderCircle } from "lucide-react";
import useToast from "../../hooks/useToast";

const OAuthSuccess = () => {
  const { handleOAuthSuccess } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      try {
        const result = await handleOAuthSuccess();
        
        if (result.success) {
          toast.success("Successfully signed in!");
          // Wait a bit to show the success message before navigating
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 5000); // 2 seconds delay
        } else {
          // Handle case where result exists but success is false
          throw new Error(result.message || "Login failed");
        }
      } catch (error) {
        console.error("OAuth completion error:", error);
        toast.error(error.message || "Social login failed. Please try again.");
        navigate("/login", { replace: true });
      }
    };

    completeOAuthLogin();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoaderCircle className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing your sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we finalize your social login.
        </p>
      </div>
    </div>
  );
};

export default OAuthSuccess;