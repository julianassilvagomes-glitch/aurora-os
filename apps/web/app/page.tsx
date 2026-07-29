import { createClient } from "@/lib/supabase/server";
import { AuroraHero } from "./aurora-hero";
import { LoginForm } from "./login-form";
import { UserMenu } from "./user-menu";
import { ModuleCards } from "./module-cards";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AuroraHero />
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-background px-6 py-16">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark">Aurora OS</h1>
        <UserMenu email={user.email ?? ""} />
      </div>
      <p className="w-full max-w-2xl text-sm text-text-secondary">
        Autenticada como {user.email}
      </p>
      <ModuleCards />
    </div>
  );
}
