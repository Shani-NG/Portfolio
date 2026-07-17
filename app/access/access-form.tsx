"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AccessFormProps = {
  nextPath: string;
};

export function AccessForm({ nextPath }: AccessFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Access could not be verified.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Access could not be verified. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="access-form" onSubmit={handleSubmit}>
      <label htmlFor="portfolio-password">Password</label>
      <input
        id="portfolio-password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        autoFocus
      />
      <button type="submit" disabled={isSubmitting || password.length === 0}>
        {isSubmitting ? "Checking…" : "Enter portfolio"}
      </button>
      <p className="form-message" role="status" aria-live="polite">
        {error}
      </p>
    </form>
  );
}
