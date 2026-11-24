import type { Express, Request } from "express";
import type { Database, Role, User } from "../types";
import { body, currentUser, HttpError, param, publicUser, requireFaculty, text } from "../http";
import UsersDao from "./dao";

export default function UserRoutes(app: Express, db: Database) {
  const dao = UsersDao(db);
  const readUser = (req: Request, signup = false): Omit<User, "_id"> => {
    const input = body(req);
    const username = text(input.username, "Username", true).trim();
    const password = text(input.password, "Password", true);
    if (dao.findUserByUsername(username)) throw new HttpError(400, "Username already exists");
    const role = signup ? "STUDENT" : input.role ?? "STUDENT";
    if (!["STUDENT", "FACULTY", "ADMIN"].includes(String(role))) throw new HttpError(400, "Invalid role");
    return {
      username, password, role: role as Role,
      firstName: text(input.firstName ?? "", "First name"),
      lastName: text(input.lastName ?? "", "Last name"),
      email: text(input.email ?? "", "Email"), dob: text(input.dob ?? "", "Date of birth"),
    };
  };
  const startSession = async (req: Request, id: string) => {
    await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.userId = id;
    await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  };

  app.post("/api/users/signin", async (req, res) => {
    const input = body(req);
    const user = dao.findUserByCredentials(text(input.username, "Username", true).trim(), text(input.password, "Password", true));
    if (!user) throw new HttpError(401, "Invalid username or password");
    await startSession(req, user._id); res.json(publicUser(user));
  });
  app.post("/api/users/signup", async (req, res) => {
    const user = dao.createUser(readUser(req, true));
    await startSession(req, user._id); res.status(201).json(publicUser(user));
  });
  app.get("/api/users/profile", (req, res) => { res.json(publicUser(currentUser(req, db))); });
  app.post("/api/users/signout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("kambaz.sid", { path: "/", httpOnly: true }); res.sendStatus(200);
    });
  });
  app.get("/api/users", requireFaculty(db), (_req, res) => { res.json(dao.findAllUsers().map(publicUser)); });
  app.post("/api/users", requireFaculty(db), (req, res) => { res.status(201).json(publicUser(dao.createUser(readUser(req)))); });
  app.get("/api/users/:userId", (req, res) => {
    const actor = currentUser(req, db);
    const id = param(req, "userId") === "current" ? actor._id : param(req, "userId");
    if (id !== actor._id && actor.role === "STUDENT") throw new HttpError(403, "You can only view your own profile");
    const user = dao.findUserById(id);
    if (!user) throw new HttpError(404, "User not found");
    res.json(publicUser(user));
  });
  app.put("/api/users/:userId", (req, res) => {
    const actor = currentUser(req, db);
    const id = param(req, "userId") === "current" ? actor._id : param(req, "userId");
    const user = dao.findUserById(id);
    if (!user) throw new HttpError(404, "User not found");
    if (id !== actor._id && actor.role === "STUDENT") throw new HttpError(403, "You can only update your own profile");
    const input = body(req), patch: Partial<User> = {};
    for (const field of ["firstName", "lastName", "email", "dob"] as const) {
      if (input[field] !== undefined) patch[field] = text(input[field], field);
    }
    if (input.username !== undefined) {
      const username = text(input.username, "Username", true).trim();
      const existing = dao.findUserByUsername(username);
      if (existing && existing._id !== id) throw new HttpError(400, "Username already exists");
      patch.username = username;
    }
    if (input.password !== undefined && input.password !== "") patch.password = text(input.password, "Password", true);
    // A profile form cannot grant itself elevated permissions.
    if (actor.role !== "STUDENT" && id !== actor._id && input.role !== undefined) {
      if (!["STUDENT", "FACULTY", "ADMIN"].includes(String(input.role))) throw new HttpError(400, "Invalid role");
      patch.role = input.role as Role;
    }
    res.json(publicUser(dao.updateUser(id, patch)!));
  });
  app.delete("/api/users/:userId", requireFaculty(db), (req, res) => {
    const id = param(req, "userId");
    if (!dao.findUserById(id)) throw new HttpError(404, "User not found");
    if (id === currentUser(req, db)._id) throw new HttpError(400, "Use another faculty account to delete this account");
    dao.deleteUser(id); res.sendStatus(200);
  });
}
