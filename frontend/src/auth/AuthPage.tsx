import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AuthPage.css";

type AuthMode = "login" | "signup";

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage("Please enter both email and password.");
      setIsError(true);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      setIsError(true);
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        setMessage(
          "Account created successfully. Please check your email if confirmation is required."
        );
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw error;
        }

        setMessage("Login successful.");
      }
    } catch (error) {
      setIsError(true);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setMessage("");
    setIsError(false);
    setPassword("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Scanify AI</h1>
          <p>Your smart document workspace</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        {message && (
          <div
            className={
              isError
                ? "auth-message auth-error"
                : "auth-message auth-success"
            }
          >
            {message}
          </div>
        )}

        <p className="auth-switch-text">
          {mode === "login"
            ? "New to Scanify AI?"
            : "Already have an account?"}

          <button
            type="button"
            className="auth-switch-button"
            onClick={() =>
              switchMode(mode === "login" ? "signup" : "login")
            }
          >
            {mode === "login" ? "Create account" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;