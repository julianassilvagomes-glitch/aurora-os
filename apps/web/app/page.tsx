import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { CategoriaList } from "./categoria-list";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-zinc-50 px-6 py-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Aurora OS
      </h1>
      {user ? (
        <CategoriaList userEmail={user.email ?? ""} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
