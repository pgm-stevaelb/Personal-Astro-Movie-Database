import * as React from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase/client";
import { ensureProfile } from "../lib/db";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function AuthForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleAuth = async (mode: "sign-in" | "sign-up") => {
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        if (data.session?.user) {
          await ensureProfile(data.user.id, data.user.email);
        }
        toast.success("Check your email to confirm your account.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          await ensureProfile(data.user.id, data.user.email);
        }
        toast.success("Welcome back!");
        window.location.href = "/search";
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Access your tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="sign-up">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => handleAuth("sign-in")} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </TabsContent>
          <TabsContent value="sign-up" className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="w-full" variant="secondary" onClick={() => handleAuth("sign-up")} disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
