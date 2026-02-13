
import { GraduationCap } from "lucide-react";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/chat");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px]" />

      <div className="z-10 w-full max-w-md p-8 glass-card rounded-2xl flex flex-col items-center gap-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center gap-y-4">
          <div className="p-4 bg-indigo-100 rounded-full">
            <GraduationCap className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="text-center">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 block">Colegio Cambridge de Monterrey</span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Learning Walk Feedback</h1>
            <p className="text-slate-400 mt-2">Plataforma de retroalimentación inteligente</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button className="w-full h-12 bg-white text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-x-3 hover:bg-slate-100 transition-all shadow-lg active:scale-95">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continuar con Google
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 px-8 leading-relaxed">
            Solo disponible para cuentas con dominio <span className="text-indigo-400 font-medium">@cambridgemty.edu.mx</span>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700 w-full text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold italic">Powered by AI Master Academic</p>
        </div>
      </div>
    </div>
  );
}
