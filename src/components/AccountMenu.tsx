import * as React from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase/client";
import { useSession } from "../lib/session";
import { ensureProfile } from "../lib/db";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";

export type AccountMenuProps = {
  variant?: "dropdown" | "panel";
};

export default function AccountMenu({ variant = "dropdown" }: AccountMenuProps) {
  const { user, loading } = useSession();

  React.useEffect(() => {
    if (!user) return;
    ensureProfile(user.id, user.email).catch((error) => {
      console.error(error);
    });
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed");
      return;
    }
    toast.success("Signed out");
    window.location.href = "/auth";
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild size="sm" variant={variant === "panel" ? "default" : "outline"}>
        <a href="/auth">Sign in</a>
      </Button>
    );
  }

  if (variant === "panel") {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          {user.email?.split("@")[0] ?? "Account"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/account">Account</a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
