import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import hospitalLogo from "@/assets/hospital-logo.png";
import { getAuthorizedStaffUser, signInStaff } from "@/lib/staffAuth";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const access = await getAuthorizedStaffUser();

        if (access.staff) {
          navigate("/staff", { replace: true });
          return;
        }

        if (access.error) {
          setError(access.error);
        }
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError("Please enter your staff email.");
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    const result = await signInStaff(trimmedEmail, trimmedPassword);

    if (result.error) {
      if (result.error === "Invalid login credentials") {
        setError("Invalid login. Please check your email and password.");
      } else {
        setError(result.error);
      }
      setIsSubmitting(false);
      return;
    }

    navigate("/staff", { replace: true });
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center text-muted-foreground">
          Checking your session...
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src={hospitalLogo}
            alt="Hospital Logo"
            className="h-24 w-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-center">Mahatme Eye Hospital</h1>
          <p className="text-muted-foreground text-center">
            Staff Login - Queue Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="email">Staff Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Enter Staff Dashboard"}
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={() => navigate("/display")}
          className="w-full"
        >
          View Display Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default Auth;
