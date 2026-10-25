import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PrepMate" },
      { name: "description", content: "Sign in or create your free PrepMate placement preparation account." },
      { property: "og:title", content: "Sign in — PrepMate" },
      { property: "og:description", content: "Sign in or create your free PrepMate placement preparation account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function sanitizeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) return raw;
  return null;
}

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const next = sanitizeNext(Route.useSearch()?.next);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "lovable" | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  // After any sign-in round-trip (including OAuth returns), land on `next` or the dashboard.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: next ?? "/dashboard", replace: true });
        router.invalidate();
      } else {
        setChecking(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!z.string().email().safeParse(email).success) return toast.error("Enter a valid email address.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: next ?? "/dashboard", replace: true });
    router.invalidate();
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (fullName.length < 2) return toast.error("Enter your full name.");
    if (!z.string().email().safeParse(email).success) return toast.error("Enter a valid email address.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Account created!");
      navigate({ to: next ?? "/dashboard", replace: true });
      router.invalidate();
    } else {
      setConfirmEmail(email);
    }
  }

  async function handleSocial(provider: "google" | "lovable") {
    setSocialLoading(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/auth",
    });
    setSocialLoading(null);
    if (result.error) toast.error(result.error.message);
    if (result.redirected) return;
    // Session already set in the preview flow — go to the app.
    navigate({ to: next ?? "/dashboard", replace: true });
    router.invalidate();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden gradient-primary p-10 text-primary-foreground lg:flex">
        <div className="dotted-grid pointer-events-none absolute inset-0 opacity-20" />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-card/20 backdrop-blur">
            <Sparkles className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">PrepMate</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">One workspace for the whole placement season.</h2>
          <ul className="mt-6 space-y-3 text-sm text-primary-foreground/90">
            {[
              "Daily study planner with completion tracking",
              "DSA tracker with charts and revision reminders",
              "AI interview coach with instant answer feedback",
              "Resume analyzer matched to real job descriptions",
              "A transparent placement readiness score",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4.5 shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">Your data is private to your account, always.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">PrepMate</span>
          </div>

          {confirmEmail ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Mail className="size-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-semibold text-foreground">{confirmEmail}</span>.
                Click it to activate your account, then sign in.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setConfirmEmail(null)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <Card className="rounded-3xl border-border bg-card p-1.5 shadow-lift">
              <div className="p-6">
                <h1 className="font-display text-2xl font-bold">Welcome {checking ? "" : ""}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Sign in or create your free account to continue.</p>

                <Tabs defaultValue="signin" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Create account</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input id="signin-email" name="email" type="email" placeholder="you@college.edu" required autoComplete="email" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input id="signin-password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
                      </div>
                      <Button type="submit" disabled={loading || checking} className="w-full gradient-primary">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name">Full name</Label>
                        <Input id="signup-name" name="fullName" placeholder="Aarav Sharma" required autoComplete="name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="you@college.edu" required autoComplete="email" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
                      </div>
                      <Button type="submit" disabled={loading || checking} className="w-full gradient-primary">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-2.5">
                  <Button variant="outline" className="h-11 bg-card" disabled={socialLoading !== null} onClick={() => handleSocial("google")}>
                    {socialLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />} Continue with Google
                  </Button>
                  <Button variant="outline" className="h-11 bg-card" disabled={socialLoading !== null} onClick={() => handleSocial("lovable")}>
                    {socialLoading === "lovable" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-primary" />} Continue with Lovable
                  </Button>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By continuing you agree to use PrepMate for your own preparation. <Link to="/" className="underline hover:text-foreground">Back to home</Link>
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.7-.2-2.5H12v4.8h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.7Z" />
    </svg>
  );
}
