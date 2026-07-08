import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const isDev = process.env.NODE_ENV === "development";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Login com email/senha via Supabase Auth
    Credentials({
      id: "email-login",
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (error || !data.user) {
          console.error("Supabase Auth error:", error?.message);
          return null;
        }

        return {
          id: data.user.id,
          name: data.user.user_metadata?.nome || data.user.email?.split("@")[0] || "Usuário",
          email: data.user.email,
        };
      },
    }),
    // Adicionar um provedor de credenciais fake para desenvolvimento ou se o Google não estiver configurado
    ...(isDev || !process.env.GOOGLE_CLIENT_ID ? [
      Credentials({
        id: "dev-login",
        name: "Login de Desenvolvimento",
        credentials: {},
        async authorize() {
          return { 
            id: "dev-user", 
            name: "Equipe Paulistana", 
            email: "sidnei@sfaisolutions.com" 
          };
        },
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Se for o login de dev, permite sempre
      if (account?.provider === "dev-login") {
        return true;
      }

      // Login via Supabase Auth (email/senha) — permite qualquer usuário autenticado
      if (account?.provider === "email-login") {
        return true;
      }

      // Login via Google — mantém whitelist
      const authorizedEmails = (process.env.AUTHORIZED_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      if (user.email && authorizedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      return false; 
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", 
  },
})
