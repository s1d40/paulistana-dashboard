import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
