import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to /generate
  const from = (location.state as any)?.from?.pathname || "/generate";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed");
        console.error("Login failed:", data);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("user", JSON.stringify({ username: data.username }));

      // ✅ Trigger userChange event so Layout updates immediately
      window.dispatchEvent(new Event("userChange"));

      // Navigate to the intended destination or default to /generate
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neon-darker">
      <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md border border-neon-purple/20 shadow-2xl shadow-neon-purple/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 text-neon-cyan text-sm font-medium animate-neon-pulse mb-4">
            <Sparkles className="w-4 h-4" />
            <span>BelvCrysta</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400">
            Sign in to access your crystal generation workspace
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-neon-purple/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/60 focus:shadow-neon-cyan transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-neon-purple/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/60 focus:shadow-neon-cyan transition-all duration-200 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neon-cyan transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-neon-gradient text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 animate-neon-pulse"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              className="text-neon-cyan hover:text-neon-purple transition-colors font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
