
import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (onLogin) {
      onLogin({ email: email.trim(), password });
    } else {
      setError("Login service is not connected yet.");
    }
  }

  return (
    <main className="login-screen">
      <section className="login-art">
        <div className="login-brand">
          <div className="login-logo">S</div>
          <strong>SmartCampus</strong>
        </div>

        <div className="login-art-content">
          <span className="login-eyebrow">YOUR CAMPUS, CONNECTED</span>
          <h1>Your college life,<br />all in one place.</h1>
          <p>Stay informed, access student services, and make every campus day simpler.</p>
          <div className="login-decoration">
            <div className="login-sun" />
            <div className="login-building">
              <div className="login-roof" />
              <div className="login-windows">
                {Array.from({ length: 6 }, (_, i) => <span key={i} />)}
              </div>
            </div>
          </div>
        </div>

        <span className="login-footer">A smarter way to experience campus.</span>
      </section>

      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <div className="login-logo">S</div>
            <strong>SmartCampus</strong>
          </div>

          <span className="login-eyebrow purple-text">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="login-subtitle">Enter your details to access your student portal.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="student-email">College email</label>
            <input
              id="student-email"
              type="email"
              autoComplete="username"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-label">
              <label htmlFor="student-password">Password</label>
            </div>
            <div className="password-wrap">
              <input
                id="student-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button className="login-submit" type="submit">Sign in <span>→</span></button>
          </form>

          <div className="login-divider"><span>STUDENT ACCESS</span></div>
          <p className="login-register">
            New to SmartCampus?{" "}
            <button type="button" onClick={onRegister}>Create an account</button>
          </p>
          <p className="login-security">🔒 Your campus account should be kept private.</p>
          <p className="login-demo-note">Demo interface — authentication will be connected in a later step.</p>
        </div>
      </section>
    </main>
  );
}
