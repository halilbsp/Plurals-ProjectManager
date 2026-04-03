"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Settings2, ArrowRight, Eye, EyeOff } from "lucide-react";

import { loginUser, registerUser } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res =
        mode === "login"
          ? await loginUser(email.trim(), password)
          : await registerUser(name.trim(), email.trim(), password);

      login(res.token, res.user, res.workspace || null);
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0A21] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Settings2 size={32} className="text-white" />
          <span className="text-3xl font-bold text-white tracking-wide">
            Plurals
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-[0_32px_120px_rgba(52,36,122,0.3)] overflow-hidden">
          {/* Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#34247A] via-[#7C5DFA] to-[#B794F4]" />

          <div className="p-8">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-white text-[#34247A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-white text-[#34247A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Name (register only) */}
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#34247A] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#34247A] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSubmit();
                    }}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-100 focus:border-[#34247A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#34247A] hover:bg-[#2A1D63] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/20 transition-all active:scale-[0.97] disabled:opacity-60 mt-2"
              >
                {isSubmitting ? (
                  "Please wait..."
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 text-center uppercase tracking-wider mb-3">
                Demo Credentials
              </p>
              <button
                onClick={() => {
                  setMode("login");
                  setEmail("ar.shakir@plurals.com");
                  setPassword("demo123");
                }}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
              >
                ar.shakir@plurals.com / demo123
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}