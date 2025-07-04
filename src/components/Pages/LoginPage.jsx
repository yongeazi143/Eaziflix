import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, CircleX } from "lucide-react";
import GoogleIcon from "../GoogleIcon";
import Navbar from "../Navbar";
import { Link } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import useToast from "../../hooks/useToast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
const { login, loginWithGoogle, loginWithGitHub, socialLoginLoading } = useUser();
  const { toast } = useToast();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateEmailField = (email) => {
    if (!email.trim()) return "Email address is required";
    if (!validateEmail(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePasswordField = (password) => {
    if (!password.trim()) return "Password is required";
    if (!validatePassword(password))
      return "Your password must contain between 8 or more characters.";
    return "";
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    setEmailError(validateEmailField(email));
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    setPasswordError(validatePasswordField(password));
  };

  const handleEmailFocus = () => {
    setEmailFocused(true);
    setEmailError("");
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    setPasswordError("");
  };

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
        await login(email, password, rememberMe);
        // Show toast immediately
        toast.success("Login successful!");
      } catch (error) {
        if (error.message === "VERIFICATION_REQUIRED") {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          toast.error(error.message || "Login failed. Please try again.");
        }
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

      <section className="relative z-10 flex items-center justify-center pt-20 pb-5 mx-4 md:mx-0">
        <div
          className="w-full max-w-md rounded-md p-6 sm:p-12  
                backdrop-blur-lg
                border border-white/30
                shadow-lg ring-1 ring-inset ring-white/5 backdrop-brightness-75"
        >
          <h2>Login In</h2>

          <form
            onSubmit={(e) => handleFormAuthentication(e)}
            className="space-y-4 mt-4"
          >
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
                <p
                  className="text-red-500 text-xs mt-2 flex items-center justify-start gap-1"
                >
                  <CircleX size={15} /> {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] py-3 font-bold  text-white px-4 hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderCircle className="animate-spin" size={20} />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center text-gray-400 mt-4">OR</div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={() => loginWithGoogle(rememberMe)}
                disabled={socialLoginLoading}
                className="flex flex-1 items-center justify-center rounded bg-white/10 py-2.5 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoginLoading ? (
                  <LoaderCircle className="animate-spin mr-2" size={20} />
                ) : (
                  <GoogleIcon />
                )}
                Google
              </button>
              <button
                type="button"
                onClick={() => loginWithGitHub(rememberMe)}
                disabled={socialLoginLoading}
                className="flex flex-1 items-center gap-2 justify-center rounded bg-white/10 py-2.5 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoginLoading ? (
                  <LoaderCircle className="animate-spin" size={20} />
                ) : (
                  <img
                    src="./github-logo.svg"
                    alt="github-logo"
                    width={20}
                    height={20}
                  />
                )}
                GitHub
              </button>
            </div>

            <div className="text-center">
              <Link to="/forget-password" className="text-sm text-gray-400 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>

          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-checkbox h-4 w-4 rounded border-gray-600 bg-gray-700 text-red-600 focus:ring-red-500"
            />
            <span className="ml-2 text-white">Remember me</span>
          </label>

          <div className="text-gray-400 mt-4">
            New to Eazi<span className="text-gradient">Flix?</span>
            {"  "}
            <Link
              to="/createaccount"
              className="font-bold text-white hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
