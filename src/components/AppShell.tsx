import * as React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Toaster } from "./ui/sonner";
import AccountMenu from "./AccountMenu";

type AppShellProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#0b1220_45%,_#070b12_100%)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Cpath fill=%22%2356d3d0%22 fill-opacity=%220.08%22 d=%22M0 0h40v40H0zM40 40h40v40H40z%22/%3E%3C/svg%3E')] opacity-70" />
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30 grid place-items-center text-lg font-semibold">
              ST
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Serie Tracker</h1>
                <Badge variant="secondary" className="uppercase tracking-wide">
                  beta
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Personal series + movie tracker.</p>
            </div>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="rounded-full">
              <a href="/search">Search</a>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <a href="/library">Library</a>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <a href="/account">Account</a>
            </Button>
          </nav>
          <div className="flex items-center gap-3">
            <AccountMenu />
            <Button asChild size="sm" variant="outline" className="rounded-full md:hidden">
              <a href="/library">Library</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
        {title ? (
          <div className="mb-8">
            <h2 className="text-3xl font-semibold">{title}</h2>
          </div>
        ) : null}
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
