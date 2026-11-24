import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import session from "express-session";
import { randomBytes } from "node:crypto";
import Hello from "./Hello";
import Lab5 from "./Lab5";
import createDatabase from "./Kambaz/Database";
import UserRoutes from "./Kambaz/Users/routes";
import CourseRoutes from "./Kambaz/Courses/routes";
import ModuleRoutes from "./Kambaz/Modules/routes";
import AssignmentRoutes from "./Kambaz/Assignments/routes";
import EnrollmentRoutes from "./Kambaz/Enrollments/routes";
import { HttpError } from "./Kambaz/http";

export default function createApp() {
  const app = express();
  const db = createDatabase();
  const production = process.env.SERVER_ENV === "production";
  const secret = process.env.SESSION_SECRET || (production ? "" : randomBytes(32).toString("hex"));
  if (!secret) throw new Error("Set SESSION_SECRET before starting the production server");
  const origins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map((value) => value.trim().replace(/\/$/, ""));
  const allowed = (origin: string) => origins.includes(origin) || (!production && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
  app.disable("x-powered-by");
  if (production) app.set("trust proxy", 1);
  app.use(cors({ credentials: true, origin: (origin, callback) => {
    if (!origin || allowed(origin)) callback(null, true);
    else callback(new HttpError(403, "This client origin is not allowed"));
  } }));
  app.use(session({
    name: "kambaz.sid", secret, resave: false, saveUninitialized: false,
    proxy: production,
    cookie: { httpOnly: true, secure: production, sameSite: production ? "none" : "lax", maxAge: 1000 * 60 * 60 * 8 },
  }));
  app.use(express.json({ limit: "100kb" }));
  Hello(app); Lab5(app);
  UserRoutes(app, db); CourseRoutes(app, db); ModuleRoutes(app, db);
  AssignmentRoutes(app, db); EnrollmentRoutes(app, db);
  app.use((_req, _res, next) => next(new HttpError(404, "Route not found")));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : error.status === 400 ? 400 : 500;
    const message = status === 500 ? "The server could not complete the request" : error.message;
    if (status === 500) console.error(error);
    res.status(status).json({ message });
  };
  app.use(errors);
  return app;
}
