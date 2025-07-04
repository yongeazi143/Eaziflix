// UserContext.jsx - Enhanced with Social Login functionality
import { ID } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "../appwrite";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  const [cooldownExpiry, setCooldownExpiry] = useState(null);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(null);
  const [socialLoginLoading, setSocialLoginLoading] = useState(false);
  const navigate = useNavigate();

  // Regular email/password login
  const login = async (email, password, rememberMe = false) => {
    try {
      const loggedIn = await account.createEmailPasswordSession(email, password);
      
      const userData = await account.get();
      
      if (!userData.emailVerification) {
        await account.deleteSession("current");
        
        setPendingVerificationEmail({
          email,
          password,
          timestamp: Date.now(),
          fromLogin: true
        });
        
        throw new Error("VERIFICATION_REQUIRED");
      }

      // Handle Remember Me logic
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        
        if (sessionTimer) {
          clearTimeout(sessionTimer);
          setSessionTimer(null);
        }
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.setItem('shortSession', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        
        const timer = setTimeout(async () => {
          try {
            await logout();
            console.log("Session expired - user was logged out");
          } catch (error) {
            console.error("Error during automatic logout:", error);
          }
        }, 60 * 60 * 1000);
        
        setSessionTimer(timer);
      }
      
      setTimeout(() => {
        setUser(userData);
      }, 3000); 

      setLoading(false);
      setPendingVerificationEmail(null);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message === "VERIFICATION_REQUIRED") {
        setPendingVerificationEmail({
          email,
          password,
          timestamp: Date.now(),
          fromLogin: true
        });
        throw new Error("VERIFICATION_REQUIRED");
      } else if (error.code === 401) {
        throw new Error("Invalid email or password.");
      } else if (error.code === 400) {
        throw new Error("Please enter valid email and password.");
      } else {
        throw new Error("Login failed. Please try again later.");
      }
    }
  };

  // *** NEW: Social Login Functions ***
  
// Google OAuth login with better error handling
const loginWithGoogle = async (rememberMe = false) => {
  try {
    setSocialLoginLoading(true);
    
    // Store remember me preference for after OAuth redirect
    if (rememberMe) {
      localStorage.setItem('pendingRememberMe', 'true');
    } else {
      localStorage.removeItem('pendingRememberMe');
    }
    
    // Get current origin for redirect
    const origin = window.location.origin;
    const successUrl = `${origin}/oauth-success`;
    const failureUrl = `${origin}/oauth-failure`;
    
    console.log('Starting Google OAuth with URLs:', { successUrl, failureUrl });
    
    // Create OAuth2 session with Google
    account.createOAuth2Session(
      'google',
      successUrl,
      failureUrl
    );
    
    return { success: true, redirecting: true };
  } catch (error) {
    console.error("Google login error:", error);
    setSocialLoginLoading(false);
    
    // More specific error handling
    if (error.code === 400) {
      throw new Error("Google OAuth not properly configured. Please check your Appwrite project settings.");
    } else if (error.code === 401) {
      throw new Error("Google OAuth authentication failed. Please try again.");
    } else {
      throw new Error(`Google login failed: ${error.message || 'Unknown error'}`);
    }
  }
};


  // GitHub OAuth login
  const loginWithGitHub = async (rememberMe = false) => {
    try {
      setSocialLoginLoading(true);
      
      // Store remember me preference for after OAuth redirect
      if (rememberMe) {
        localStorage.setItem('pendingRememberMe', 'true');
      } else {
        localStorage.removeItem('pendingRememberMe');
      }
      
      // Get current origin for redirect
      const origin = window.location.origin;
      const successUrl = `${origin}/oauth-success`;
      const failureUrl = `${origin}/oauth-failure`;
      
      // Create OAuth2 session with GitHub
      account.createOAuth2Session(
        'github',
        successUrl,
        failureUrl
      );
      
      return { success: true, redirecting: true };
    } catch (error) {
      console.error("GitHub login error:", error);
      setSocialLoginLoading(false);
      throw new Error("GitHub login failed. Please try again.");
    }
  };

  // Handle OAuth success (call this from your OAuth success page)
  const handleOAuthSuccess = async () => {
    try {
      setLoading(true);
      
      // Get user data from the OAuth session
      const userData = await account.get();
      
      // Check if remember me was set before OAuth
      const rememberMe = localStorage.getItem('pendingRememberMe') === 'true';
      
      // Handle session persistence
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        localStorage.removeItem('pendingRememberMe');
        
        if (sessionTimer) {
          clearTimeout(sessionTimer);
          setSessionTimer(null);
        }
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('pendingRememberMe');
        localStorage.setItem('shortSession', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        
        const timer = setTimeout(async () => {
          try {
            await logout();
            console.log("Session expired - user was logged out");
          } catch (error) {
            console.error("Error during automatic logout:", error);
          }
        }, 60 * 60 * 1000);
        
        setSessionTimer(timer);
      }
      
      setUser(userData);
      setLoading(false);
      setSocialLoginLoading(false);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error("OAuth success handling error:", error);
      setLoading(false);
      setSocialLoginLoading(false);
      throw new Error("Failed to complete social login. Please try again.");
    }
  };

  // Handle OAuth failure (call this from your OAuth failure page)
  const handleOAuthFailure = (error) => {
    setSocialLoginLoading(false);
    setLoading(false);
    localStorage.removeItem('pendingRememberMe');
    
    let errorMessage = "Social login failed. Please try again.";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.type === 'user_oauth2_unauthorized') {
      errorMessage = "Google authentication failed: Invalid client configuration";
    }
    
    throw new Error(errorMessage);
  };

  // // Check if user is authenticated via OAuth (useful for OAuth callback pages)
  // const checkOAuthSession = async () => {
  //   try {
  //     const userData = await account.get();
  //     return userData;
  //   } catch (error) {
  //     console.error("OAuth session check error:", error);
  //     return null;
  //   }
  // };

  // *** END: Social Login Functions ***

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      
      // Clear all session-related localStorage items
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('shortSession');
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('pendingRememberMe');
      
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      setPendingVerificationEmail(null);
      setSocialLoginLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      
      // Still clear localStorage even if logout failed
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('shortSession');
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('pendingRememberMe');
      
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      setSocialLoginLoading(false);
      throw new Error("Logout failed, but you've been signed out locally.");
    }
  };

  // Function to check if current session should be maintained
  const shouldMaintainSession = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const shortSession = localStorage.getItem('shortSession') === 'true';
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (rememberMe) {
      return true;
    }
    
    if (shortSession && sessionStartTime) {
      const elapsed = Date.now() - parseInt(sessionStartTime);
      const oneHour = 60 * 60 * 1000;
      return elapsed < oneHour;
    }
    
    return false;
  };

  // Function to get remaining session time (for UI display)
  const getRemainingSessionTime = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const shortSession = localStorage.getItem('shortSession') === 'true';
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (rememberMe) {
      return null;
    }
    
    if (shortSession && sessionStartTime) {
      const elapsed = Date.now() - parseInt(sessionStartTime);
      const oneHour = 60 * 60 * 1000;
      return Math.max(0, oneHour - elapsed);
    }
    
    return 0;
  };

  // ... (keep all your existing functions: register, sendVerificationEmail, verifyEmail, etc.)
  const register = async (email, password) => {
    try {
      const newUser = await account.create(ID.unique(), email, password);

      setPendingVerificationEmail({
        email,
        password,
        timestamp: Date.now(),
        fromLogin: false
      });

      const session = await account.createEmailPasswordSession(email, password);
      
      await sendVerificationEmail();
      
      await account.deleteSession("current");
      
      return { 
        success: true, 
        message: "Account created successfully! Please check your email and verify your account before logging in.",
        needsVerification: true 
      };
    } catch (error) {
      console.error("Registration error:", error);
      
      try {
        await account.deleteSession("current");
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error.code === 409) {
        try {
          const session = await account.createEmailPasswordSession(email, password);
          const userData = await account.get();
          
          if (!userData.emailVerification) {
            await account.deleteSession("current");
            setPendingVerificationEmail({
              email,
              password,
              timestamp: Date.now(),
              fromLogin: false
            });
            throw new Error("ACCOUNT_EXISTS_UNVERIFIED");
          } else {
            await account.deleteSession("current");
            throw new Error("A verified account with this email already exists. Please log in instead.");
          }
        } catch (loginError) {
          if (loginError.message === "ACCOUNT_EXISTS_UNVERIFIED") {
            setPendingVerificationEmail({
              email,
              password,
              timestamp: Date.now(),
              fromLogin: false
            });
            throw new Error("ACCOUNT_EXISTS_UNVERIFIED");
          }
          throw new Error("A verified account with this email already exists. Please log in instead.");
        }
      } else if (error.code === 400) {
        throw new Error("Invalid email or password format.");
      } else {
        throw new Error("Registration failed. Please try again later.");
      }
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const origin = window.location.origin;
      await account.createVerification(`${origin}/verify-email`);
      setVerificationSent(true);
      return { success: true };
    } catch (error) {
      console.error("Verification email error:", error);
      throw new Error("Failed to send verification email. Please try again later.");
    }
  };

  const verifyEmail = async (userId, secret) => {
    try {
      await account.updateVerification(userId, secret);
      setPendingVerificationEmail(null);
      return { success: true, message: "Email verified successfully! You can now log in." };
    } catch (error) {
      console.error("Email verification error:", error);
      if (error.code === 401) {
        throw new Error("Invalid or expired verification link.");
      } else {
        throw new Error("Email verification failed. Please try again or request a new verification email.");
      }
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!pendingVerificationEmail) {
        throw new Error("No pending verification found. Please try logging in again or register a new account.");
      }

      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        throw new Error(`Please wait before sending another verification email.`);
      }

      const { email, password, timestamp, fromLogin } = pendingVerificationEmail;

      const timeoutLimit = fromLogin ? 10 * 60 * 1000 : 5 * 60 * 1000;
      
      if (Date.now() - timestamp > timeoutLimit) {
        setPendingVerificationEmail(null);
        const timeoutMessage = fromLogin 
          ? "Verification session expired (10 minutes). Please try logging in again."
          : "Verification session expired (5 minutes). Please register again.";
        throw new Error(timeoutMessage);
      }

      const session = await account.createEmailPasswordSession(email, password);

      await sendVerificationEmail();

      await account.deleteSession("current");

      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
      
      const expiry = Date.now() + 60000;
      setCooldownExpiry(expiry);
      
      const timer = setInterval(() => {
        const remaining = Math.ceil((expiry - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timer);
          setCooldownTimer(null);
        }
      }, 1000);
      
      setCooldownTimer(timer);
      
      return { success: true, message: "Verification email sent successfully!" };
    } catch (error) {
      console.error("Resend verification error:", error);
      
      try {
        await account.deleteSession("current");
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error.code === 401) {
        setPendingVerificationEmail(null);
        throw new Error("Unable to resend verification email. Please try logging in again or register a new account.");
      } else if (error.message.includes("expired")) {
        throw error;
      } else {
        throw new Error("Failed to resend verification email. Please try again later.");
      }
    }
  };

  const handleExpiredVerification = async (email) => {
    try {
      const tempPassword = "temp_check_password";
      
      try {
        await account.createEmailPasswordSession(email, tempPassword);
      } catch (sessionError) {
        if (sessionError.code === 401) {
          throw new Error("USER_EXISTS_NEED_PASSWORD");
        } else {
          throw new Error("User not found. Please check your email or register a new account.");
        }
      }
    } catch (error) {
      if (error.message === "USER_EXISTS_NEED_PASSWORD") {
        throw new Error("Account found. Please enter your password to resend verification email.");
      }
      throw error;
    }
  };

  const resendVerificationWithCredentials = async (email, password) => {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      
      const userData = await account.get();
      
      if (userData.emailVerification) {
        await account.deleteSession("current");
        throw new Error("Your email is already verified. You can log in normally.");
      }
      
      await sendVerificationEmail();
      
      await account.deleteSession("current");
      
      setPendingVerificationEmail({
        email,
        password,
        timestamp: Date.now(),
        fromLogin: true
      });
      
      return { success: true, message: "Verification email sent successfully!" };
    } catch (error) {
      console.error("Resend with credentials error:", error);
      
      try {
        await account.deleteSession("current");
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error.code === 401) {
        throw new Error("Invalid email or password.");
      } else if (error.message.includes("already verified")) {
        throw error;
      } else {
        throw new Error("Failed to resend verification email. Please try again later.");
      }
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const origin = window.location.origin;
      await account.createRecovery(email, `${origin}/reset-password`);
      return { 
        success: true, 
        message: "Password reset email sent successfully! Please check your inbox." 
      };
    } catch (error) {
      console.error("Password reset request error:", error);
      
      if (error.code === 404) {
        return { 
          success: true, 
          message: "If an account with that email exists, you'll receive a password reset link shortly." 
        };
      } else if (error.code === 429) {
        throw new Error("Too many reset attempts. Please wait before trying again.");
      } else {
        throw new Error("Failed to send password reset email. Please try again later.");
      }
    }
  };

  const resetPassword = async (userId, secret, newPassword) => {
    try {
      await account.updateRecovery(userId, secret, newPassword);
      return { 
        success: true, 
        message: "Your password has been reset successfully!" 
      };
    } catch (error) {
      console.error("Password reset error:", error);
      
      if (error.code === 401) {
        throw new Error("Invalid or expired reset link. Please request a new password reset.");
      } else if (error.code === 400) {
        throw new Error("Invalid password format. Please ensure your password meets the requirements.");
      } else {
        throw new Error("Failed to reset password. Please try again or request a new reset link.");
      }
    }
  };

  // Modified useEffect to handle session restoration and timer setup
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true); 
      try {
        const currentUser = await account.get();
        
        const currentPath = window.location.pathname;
        const isVerificationPage = currentPath.startsWith('/verify-email');
        const isOAuthPage = currentPath.startsWith('/oauth-');

        if (isVerificationPage || isOAuthPage) {
          setUser(currentUser);
          return;
        }

        if (shouldMaintainSession()) {
          setUser(currentUser);
          
          const shortSession = localStorage.getItem('shortSession') === 'true';
          if (shortSession) {
            const remainingTime = getRemainingSessionTime();
            if (remainingTime > 0) {
              const timer = setTimeout(async () => {
                try {
                  await logout();
                  console.log("Session expired - user was logged out");
                } catch (error) {
                  console.error("Error during automatic logout:", error);
                }
              }, remainingTime);
              
              setSessionTimer(timer);
            } else {
              await logout();
            }
          }
        } else {
          await logout();
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('shortSession');
        localStorage.removeItem('sessionStartTime');
        localStorage.removeItem('pendingRememberMe');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, []);

  // Check if resend is available
  const canResendVerification = () => {
    if (!pendingVerificationEmail) return false;
    
    const { timestamp, fromLogin } = pendingVerificationEmail;
    const timeoutLimit = fromLogin ? 10 * 60 * 1000 : 5 * 60 * 1000;
    
    return (Date.now() - timestamp) <= timeoutLimit;
  };

  // Get remaining time for resend availability
  const getResendTimeRemaining = () => {
    if (!pendingVerificationEmail) return 0;
    
    const { timestamp, fromLogin } = pendingVerificationEmail;
    const timeoutLimit = fromLogin ? 10 * 60 * 1000 : 5 * 60 * 1000;
    const elapsed = Date.now() - timestamp;
    
    return Math.max(0, timeoutLimit - elapsed);
  };

  return (
    <UserContext.Provider 
      value={{ 
        current: user, 
        login, 
        logout, 
        register, 
        loading,
        verificationSent,
        setVerificationSent,
        sendVerificationEmail,
        verifyEmail,
        resendVerificationEmail,
        canResendVerification,
        getResendTimeRemaining,
        handleExpiredVerification,
        resendVerificationWithCredentials,
        pendingVerificationEmail,
        cooldownExpiry,
        cooldownTimer,
        getRemainingSessionTime, 
        shouldMaintainSession,   
        requestPasswordReset,
        resetPassword,
        // social login functions
        loginWithGoogle,
        loginWithGitHub,
        handleOAuthSuccess,
        handleOAuthFailure,
        // checkOAuthSession,
        socialLoginLoading,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};
