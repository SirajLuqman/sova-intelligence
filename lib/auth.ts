import crypto from "crypto";
import { cookies } from "next/headers";

export type AdminRole = "OWNER" | "EDITOR";

export interface AdminSession {
  id: number;
  email: string;
  role: AdminRole;
  exp: number;
}

const SESSION_COOKIE = "sova_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

function createSignature(payload: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(
  user: Omit<AdminSession, "exp">,
): string {
  const payload: AdminSession = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  const signature = createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
): AdminSession | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSession;

    if (
      typeof payload.id !== "number" ||
      typeof payload.email !== "string" ||
      (payload.role !== "OWNER" && payload.role !== "EDITOR") ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export function setAdminSessionCookie(
  response: Response,
  user: Omit<AdminSession, "exp">,
): void {
  const token = createSessionToken(user);

  const cookieHeader = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.append("Set-Cookie", cookieHeader);
}

export function clearAdminSessionCookie(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}