import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const authorizedEmails = (process.env.AUTHORIZED_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      if (user.email && authorizedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      return false; // Bloqueia e-mails fora da lista
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redireciona erros de login de volta para a página de login
  },
})
