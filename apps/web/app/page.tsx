import { createClient } from "@/lib/supabase/server";
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
      // Fundo com gradiente é uma exceção deliberada à regra geral do
      // sistema de design — vale só para esta tela, o cartão de login em
      // si continua sóbrio (bg-surface, borda fina, um botão primário).
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e9f1fb] via-[#eef0fb] to-[#efeafa] px-6 py-10 dark:from-[#0b0f14] dark:via-[#10121c] dark:to-[#120f1d]">
        <LoginForm />
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
