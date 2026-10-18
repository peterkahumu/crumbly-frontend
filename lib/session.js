import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/** Reads the session inside getServerSideProps or an API route. */
export async function getSession(req, res) {
  return getServerSession(req, res, authOptions);
}

/**
 * Guards a page's getServerSideProps to a required role. Returns either
 * `{ redirect }` or `{ session }`.
 */
export async function requireRole(ctx, role) {
  const session = await getSession(ctx.req, ctx.res);

  if (!session) {
    return {
      redirect: {
        destination: `/auth/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl ?? "/")}`,
        permanent: false,
      },
    };
  }

  if (role && session.user.role !== role) {
    return {
      redirect: {
        destination: session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/baker/dashboard",
        permanent: false,
      },
    };
  }

  const revoked = await accountRevoked(session);
  if (revoked) {
    return {
      redirect: { destination: `/auth/login?error=${revoked}`, permanent: false },
    };
  }

  return { session };
}

/** Guards an API route. Returns the session, or null after sending a response. */
export async function requireApiRole(req, res, role) {
  const session = await getSession(req, res);

  if (!session) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  if (role && session.user.role !== role) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  if (await accountRevoked(session)) {
    res.status(403).json({ error: "Account is no longer active" });
    return null;
  }

  return session;
}

async function accountRevoked(session) {
  if (!session?.accessToken) return null;
  try {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (res.status === 401) return "ACCOUNT_DISABLED";
    if (res.status === 403) return "BAKERY_SUSPENDED";
    if (!res.ok) return "ACCOUNT_DISABLED";
    return null;
  } catch (err) {
    return null;
  }
}

