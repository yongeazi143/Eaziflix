// UserContext.jsx - Most secure solution with temporary session approach
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
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const loggedIn = await account.createEmailPasswordSession(email, password);
      
      // Get user details to check verification status
      const userData = await account.get();
      
      // Check if email is verified
      if (!userData.emailVerification) {
        // Delete the session since user is not verified
        await account.deleteSession("current");
        throw new Error("Please verify your email address before logging in. Check your inbox for the verification link.");
      }
      
      setUser(userData);
      setLoading(false);
      // Clear pending verification data on successful login
      setPendingVerificationEmail(null);
      navigate("/dashboard", { replace: true });
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("verify your email")) {
        throw error; // Re-throw verification error as-is
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
      navigate("/", { replace: true });
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      navigate("/", { replace: true });
      throw new Error("Logout failed, but you've been signed out locally.");
    }
  };

  const register = async (email, password) => {
    try {
      // Step 1: Create the user account
      const newUser = await account.create(ID.unique(), email, password);
      console.log('Account Created', newUser);

      // Step 2: Store email and password temporarily in memory (only for 1 minute)
      setPendingVerificationEmail({
        email,
        password,
        timestamp: Date.now()
      });

      // Set up automatic cleanup after 1 minute
      setTimeout(() => {
        setPendingVerificationEmail(prev => {
          if (prev && Date.now() - prev.timestamp >= 60000) {
            console.log('Pending verification data expired and cleared');
            return null;
          }
          return prev;
        });
      }, 60000);

      // Step 3: Create a session temporarily to send verification email
      const session = await account.createEmailPasswordSession(email, password);
      console.log('Temporary session created:', session);
      
      // Step 4: Send verification email while authenticated
      await sendVerificationEmail();
      
      // Step 5: IMPORTANT - Delete the session so user isn't logged in
      await account.deleteSession("current");
      console.log('Temporary session deleted - user must verify email first');
      
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
        throw new Error("A user with this email already exists. Please try logging in instead.");
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
        throw new Error("No pending verification found. Please register again.");
      }

      const { email, password, timestamp } = pendingVerificationEmail;

      // Check if the data is not too old (1 minute limit)
      const oneMinute = 60 * 1000;
      if (Date.now() - timestamp > oneMinute) {
        setPendingVerificationEmail(null);
        throw new Error("Verification session expired (1 minute). Please register again.");
      }

      // Create temporary session to send verification email
      const session = await account.createEmailPasswordSession(email, password);
      console.log('Temporary session created for resend:', session);

      // Send verification email
      await sendVerificationEmail();

      // Delete the temporary session
      await account.deleteSession("current");
      console.log('Temporary session deleted after resend');

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
        throw new Error("Unable to resend verification email. Please register again.");
      } else if (error.message.includes("expired")) {
        throw error; // Re-throw expiration error as-is
      } else {
        throw new Error("Failed to resend verification email. Please register again or contact support.");
      }
    }
  };

  const init = async () => {
    try {
      const loggedIn = await account.get();
      setUser(loggedIn);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  // Check if resend is available
  const canResendVerification = () => {
    if (!pendingVerificationEmail) return false;
    
    const oneMinute = 60 * 1000;
    return (Date.now() - pendingVerificationEmail.timestamp) <= oneMinute;
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
        canResendVerification
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};