"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center max-w-sm px-6">
          <h1 className="text-2xl font-light text-text-primary mb-4">
            メールを確認してください
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            <span className="font-medium">{email}</span> に
            マジックリンクを送信しました。
            メール内のリンクをクリックしてログインしてください。
          </p>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleLogin} className="space-y-4">
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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-accent text-white text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            ログイン / 新規登録
          </button>
        </form>
      </div>
    </div>
  );
}
