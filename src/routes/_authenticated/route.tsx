import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Integration-owned protected-route gate: client-only (session lives in
// localStorage), redirects unauthenticated visitors to the sign-in page.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: Outlet,
});
