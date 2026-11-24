import type { RequestHandler, Request } from "express";
import type { Database, User, PublicUser } from "./types";

declare module "express-session" {
  interface SessionData { userId: string }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function text(value: unknown, label: string, required = false): string {
  if (typeof value !== "string" || (required && !value.trim())) {
    throw new HttpError(400, `${label} must be ${required ? "a nonempty" : "a"} string`);
  }
  return value;
}
export function param(req: Request, name: string): string {
  return text(req.params[name], name, true);
}
export function body(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new HttpError(400, "A JSON object is required");
  }
  return req.body;
}
export function publicUser(user: User): PublicUser {
  const { password: _password, ...safe } = user;
  return safe;
}
export function currentUser(req: Request, db: Database): User {
  const user = db.users.find((item) => item._id === req.session.userId);
  if (!user) throw new HttpError(401, "Please sign in first");
  return user;
}
export function requireFaculty(db: Database): RequestHandler {
  return (req, _res, next) => {
    const user = currentUser(req, db);
    if (user.role !== "FACULTY" && user.role !== "ADMIN") throw new HttpError(403, "Faculty access is required");
    next();
  };
}
export function requestedUserId(req: Request, db: Database): string {
  const user = currentUser(req, db);
  const id = param(req, "userId") === "current" ? user._id : param(req, "userId");
  if (user._id !== id && user.role === "STUDENT") throw new HttpError(403, "You can only change your own enrollment");
  if (!db.users.some((item) => item._id === id)) throw new HttpError(404, "User not found");
  return id;
}
export function requireCourse(db: Database, id: string) {
  const course = db.courses.find((item) => item._id === id);
  if (!course) throw new HttpError(404, "Course not found");
  return course;
}
