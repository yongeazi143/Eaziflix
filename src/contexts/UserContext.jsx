// UserContext.jsx - Enhanced solution with delayed session cleanup for Remember Me
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
  const [sessionTimer, setSessionTimer] = useState(null); // For managing short sessions
  const navigate = useNavigate();

  const login = async (email, password, rememberMe = false) => {
    try {
      const loggedIn = await account.createEmailPasswordSession(email, password);
      
      // Get user details to check verification status
      const userData = await account.get();
      
      // Check if email is verified
      if (!userData.emailVerification) {
        // Delete the session since user is not verified
        await account.deleteSession("current");
        
        // Store email for potential resend verification
        setPendingVerificationEmail({
          email,
          password,
          timestamp: Date.now(),
          fromLogin: true // Flag to indicate this came from login attempt
        });
        
        throw new Error("VERIFICATION_REQUIRED");
      }

      // *** START: Enhanced Remember Me Logic ***
      if (rememberMe) {
        // If "Remember Me" is checked, set persistent flag and clear any existing timer
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        
        // Clear any existing session timer
        if (sessionTimer) {
          clearTimeout(sessionTimer);
          setSessionTimer(null);
        }
      } else {
        // If "Remember Me" is NOT checked, set up short session (e.g., 1 hour)
        localStorage.removeItem('rememberMe');
        localStorage.setItem('shortSession', 'true');
        localStorage.setItem('sessionStartTime', Date.now().toString());
        
        // Set up automatic logout after 1 hour (3600000 ms)
        const timer = setTimeout(async () => {
          try {
            await logout();
            // Optionally show a notification that session expired
            console.log("Session expired - user was logged out");
            // You could also show a toast notification here
          } catch (error) {
            console.error("Error during automatic logout:", error);
          }
        }, 60 * 60 * 1000); // 1 hour
        
        setSessionTimer(timer);
      }
      // *** END: Enhanced Remember Me Logic ***
      
      setTimeout(() => {
        setUser(userData);
      }, 3000); 

      setLoading(false);
      // Clear pending verification data on successful login
      setPendingVerificationEmail(null);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message === "VERIFICATION_REQUIRED") {
        // Store email for potential resend verification
        setPendingVerificationEmail({
          email,
          password,
          timestamp: Date.now(),
          fromLogin: true
        });
        throw new Error("VERIFICATION_REQUIRED"); // Preserve specific error code
      } else if (error.code === 401) {
        throw new Error("Invalid email or password.");
      } else if (error.code === 400) {
        throw new Error("Please enter valid email and password.");
      } else {
        throw new Error("Login failed. Please try again later.");
      }
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      
      // Clear all session-related localStorage items
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('shortSession');
      localStorage.removeItem('sessionStartTime');
      
      // Clear any active session timer
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      setPendingVerificationEmail(null); // Clear any pending verification data
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      
      // Still clear localStorage even if logout failed
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('shortSession');
      localStorage.removeItem('sessionStartTime');
      
      if (sessionTimer) {
        clearTimeout(sessionTimer);
        setSessionTimer(null);
      }
      
      throw new Error("Logout failed, but you've been signed out locally.");
    }
  };

  // Function to check if current session should be maintained
  const shouldMaintainSession = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const shortSession = localStorage.getItem('shortSession') === 'true';
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (rememberMe) {
      return true; // Always maintain remembered sessions
    }
    
    if (shortSession && sessionStartTime) {
      const elapsed = Date.now() - parseInt(sessionStartTime);
      const oneHour = 60 * 60 * 1000;
      return elapsed < oneHour; // Maintain if less than 1 hour
    }
    
    return false; // Don't maintain session if no flags are set
  };

  // Function to get remaining session time (for UI display)
  const getRemainingSessionTime = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const shortSession = localStorage.getItem('shortSession') === 'true';
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (rememberMe) {
      return null; // No expiration for remembered sessions
    }
    
    if (shortSession && sessionStartTime) {
      const elapsed = Date.now() - parseInt(sessionStartTime);
      const oneHour = 60 * 60 * 1000;
      return Math.max(0, oneHour - elapsed);
    }
    
    return 0;
  };

  const register = async (email, password) => {
    try {
      // Step 1: Create the user account
      const newUser = await account.create(ID.unique(), email, password);

      // Step 2: Store email and password with extended timeout for verification
      setPendingVerificationEmail({
        email,
        password,
        timestamp: Date.now(),
        fromLogin: false
      });

      // Step 3: Create a session temporarily to send verification email
      const session = await account.createEmailPasswordSession(email, password);
      
      // Step 4: Send verification email while authenticated
      await sendVerificationEmail();
      
      // Step 5: IMPORTANT - Delete the session so user isn't logged in
      await account.deleteSession("current");
      
      return { 
        success: true, 
        message: "Account created successfully! Please check your email and verify your account before logging in.",
        needsVerification: true 
      };
    } catch (error) {
      console.error("Registration error:", error);
      
      // Clean up any session that might have been created
      try {
        await account.deleteSession("current");
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error.code === 409) {
        // User already exists - check if they need verification
        try {
          // Try to create a session to check verification status
          const session = await account.createEmailPasswordSession(email, password);
          const userData = await account.get();
          
          if (!userData.emailVerification) {
            // User exists but not verified - delete session and allow resend
            await account.deleteSession("current");
            setPendingVerificationEmail({
              email,
              password,
              timestamp: Date.now(),
              fromLogin: false
            });
            throw new Error("ACCOUNT_EXISTS_UNVERIFIED");
          } else {
            // User exists and is verified
            await account.deleteSession("current");
            throw new Error("A verified account with this email already exists. Please log in instead.");
          }
        } catch (loginError) {
          if (loginError.message === "ACCOUNT_EXISTS_UNVERIFIED") {
            // Store credentials for verification resend
            setPendingVerificationEmail({
              email,
              password,
              timestamp: Date.now(),
              fromLogin: false
            });
            throw new Error("ACCOUNT_EXISTS_UNVERIFIED"); // Preserve specific error code
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
      // Clear pending verification data on successful verification
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
      // Check if we have pending verification credentials
      if (!pendingVerificationEmail) {
        throw new Error("No pending verification found. Please try logging in again or register a new account.");
      }

      // Check if cooldown is active
      if (cooldownExpiry && Date.now() < cooldownExpiry) {
        throw new Error(`Please wait before sending another verification email.`);
      }

      const { email, password, timestamp, fromLogin } = pendingVerificationEmail;

      // For login attempts, allow longer timeout (10 minutes)
      // For registration, allow shorter timeout (5 minutes)
      const timeoutLimit = fromLogin ? 10 * 60 * 1000 : 5 * 60 * 1000;
      
      if (Date.now() - timestamp > timeoutLimit) {
        setPendingVerificationEmail(null);
        const timeoutMessage = fromLogin 
          ? "Verification session expired (10 minutes). Please try logging in again."
          : "Verification session expired (5 minutes). Please register again.";
        throw new Error(timeoutMessage);
      }

      // Create temporary session to send verification email
      const session = await account.createEmailPasswordSession(email, password);

      // Send verification email
      await sendVerificationEmail();

      // Delete the temporary session
      await account.deleteSession("current");

      // Set cooldown expiry (60 seconds from now)
      // Clear any existing timer
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
      
      // Set new cooldown
      const expiry = Date.now() + 60000;
      setCooldownExpiry(expiry);
      
      // Start countdown timer
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
      
      // Clean up any session that might have been created
      try {
        await account.deleteSession("current");
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error.code === 401) {
        // Clear invalid credentials
        setPendingVerificationEmail(null);
        throw new Error("Unable to resend verification email. Please try logging in again or register a new account.");
      } else if (error.message.includes("expired")) {
        throw error; // Re-throw expiration error as-is
      } else {
        throw new Error("Failed to resend verification email. Please try again later.");
      }
    }
  };

  // New function to handle expired verification scenarios
  const handleExpiredVerification = async (email) => {
    try {
      // Try to create a session to check if user exists and verification status
      const tempPassword = "temp_check_password"; // This will fail, but we can catch the specific error
      
      try {
        await account.createEmailPasswordSession(email, tempPassword);
      } catch (sessionError) {
        if (sessionError.code === 401) {
          // User exists but wrong password - this is expected
          // Now we know the user exists, but we need their actual password
          throw new Error("USER_EXISTS_NEED_PASSWORD");
        } else {
          // Other errors (like user doesn't exist)
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

  // Function to resend verification with email and password (for expired cases)
  const resendVerificationWithCredentials = async (email, password) => {
    try {
      // Create temporary session
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user data to check verification status
      const userData = await account.get();
      
      if (userData.emailVerification) {
        await account.deleteSession("current");
        throw new Error("Your email is already verified. You can log in normally.");
      }
      
      // Send verification email
      await sendVerificationEmail();
      
      // Delete the temporary session
      await account.deleteSession("current");
      
      // Store credentials for potential future resends
      setPendingVerificationEmail({
        email,
        password,
        timestamp: Date.now(),
        fromLogin: true
      });
      
      return { success: true, message: "Verification email sent successfully!" };
    } catch (error) {
      console.error("Resend with credentials error:", error);
      
      // Clean up any session
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
  
  // Modified useEffect to handle session restoration and timer setup
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true); 
      try {
        const currentUser = await account.get(); // Check for an active session
        
        // Get the current URL path
        const currentPath = window.location.pathname;
        const isVerificationPage = currentPath.startsWith('/verify-email');

        // If the user is on the verification page, don't interfere with the session
        if (isVerificationPage) {
          setUser(currentUser);
          return;
        }

        // Check if this session should be maintained
        if (shouldMaintainSession()) {
          setUser(currentUser);
          
          // If it's a short session, set up the timer for remaining time
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
              // Session should have expired, log out
              await logout();
            }
          }
        } else {
          // Session exists but shouldn't be maintained, log out
          await logout();
        }
      } catch (err) {
        // No session found or session invalid, which is normal
        setUser(null);
        // Clear any stored session data
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('shortSession');
        localStorage.removeItem('sessionStartTime');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, []); // The empty array ensures this runs only once on app mount

  // Check if resend is available
  const canResendVerification = () => {
    if (!pendingVerificationEmail) return false;
    
    const { timestamp, fromLogin } = pendingVerificationEmail;
    const timeoutLimit = fromLogin ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10 min for login, 5 min for registration
    
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
        getRemainingSessionTime, // New: Get remaining session time
        shouldMaintainSession,   // New: Check if session should be maintained
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};