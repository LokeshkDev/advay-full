import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./Login.css";
import logo from "../assets/Advay-Traders-Logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="cracker-login-wrapper">
      <div className="cracker-login-card">
       <div className="login-top">
        <img src={logo} width={200} alt="AD Logo"/>
      </div>
        <h1 className="cracker-title">🧨 Diwali Chit Funds</h1>

        {error && <div className="cracker-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="cracker-login-btn" type="submit">
            🔐 Login Securely
          </button>
        </form>

        <p className="cracker-footer">
          © {new Date().getFullYear()} Advay Traders Diwali Funds
        </p>
      </div>
    </div>
  );
}
