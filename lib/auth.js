import CredentialsProvider from "next-auth/providers/credentials";
/** Sign-in rejection reasons surfaced to the login form. */
export const AUTH_ERRORS = {
  INVALID: "INVALID_CREDENTIALS",
  SUSPENDED: "BAKERY_SUSPENDED",
  DISABLED: "ACCOUNT_DISABLED",
};

// Sessions are JWT-based; the token carries role + bakery ownership so
// protected routes can authorize without an extra query.
export const authOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(AUTH_ERRORS.INVALID);
        }

        try {
          const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password })
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || AUTH_ERRORS.INVALID);
          }
          
          const data = await res.json();
          // Inject token into user object so it gets passed to jwt callback
          return { ...data.user, accessToken: data.token };
        } catch (error) {
          throw new Error(error.message || AUTH_ERRORS.INVALID);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.bakeryId = user.bakeryId;
        token.bakerySlug = user.bakerySlug;
        token.bakeryStatus = user.bakeryStatus;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.bakeryId = token.bakeryId;
      session.user.bakerySlug = token.bakerySlug;
      session.user.bakeryStatus = token.bakeryStatus;
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
