"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data?.user?.identities?.length === 0) {
          setMessage(
            "このメールアドレスは既に登録されています。ログインしてください。"
          );
        } else if (data?.session) {
          router.push("/app");
          router.refresh();
        } else {
          setMessage(
            "確認メールを送信しました。メールのリンクをクリックしてからログインしてください。"
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/app");
          router.refresh();
        }
      }
    } catch (e) {
      setError("予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-sm px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-text-primary mb-2">
            Minamo
          </h1>
          <p className="text-text-secondary text-sm">
            水面 — 自分を知る、毎日少しずつ。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              required
              className="w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              required
              className="w-full px-0 py-3 bg-transparent border-b border-border text-text-primary text-lg placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          {message && (
            <p className="text-green-700 text-sm">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {loading
              ? "処理中..."
              : isSignUp
              ? "新規登録"
              : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-secondary/40">
          {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントがありませんか？"}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="ml-1 underline underline-offset-2 text-accent hover:text-accent-hover transition-colors"
          >
            {isSignUp ? "ログイン" : "新規登録"}
          </button>
        </p>
      </div>
    </div>
  );
}
