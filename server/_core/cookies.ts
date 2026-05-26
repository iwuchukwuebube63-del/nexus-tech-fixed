import type { CookieOptions, Request } from "express";

function isHttps(req: Request): boolean {
  if (req.protocol === "https") return true;
  const proto = req.headers["x-forwarded-proto"];
  if (!proto) return false;
  const list = Array.isArray(proto) ? proto : proto.split(",");
  return list.some((p) => p.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isHttps(req);
  return {
    httpOnly: true,
    path: "/",
    // Use "lax" always — the frontend and API are on the same domain on Render
    sameSite: "lax",
    secure,
  };
}
