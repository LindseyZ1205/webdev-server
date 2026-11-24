import type { Express } from "express";
import type { Database } from "../types";
import { currentUser, param, publicUser, requestedUserId, requireCourse } from "../http";
import EnrollmentsDao from "./dao";
export default function EnrollmentRoutes(app: Express, db: Database) {
  const dao = EnrollmentsDao(db);
  app.get("/api/enrollments", (req, res) => {
    const actor = currentUser(req, db);
    res.json(actor.role === "STUDENT" ? db.enrollments.filter((item) => item.user === actor._id) : db.enrollments);
  });
  app.get("/api/users/:userId/courses", (req, res) => {
    const id = requestedUserId(req, db);
    const ids = new Set(db.enrollments.filter((item) => item.user === id).map((item) => item.course));
    res.json(db.courses.filter((course) => ids.has(course._id)));
  });
  app.post("/api/users/:userId/courses/:courseId", (req, res) => {
    const userId = requestedUserId(req, db), courseId = param(req, "courseId");
    requireCourse(db, courseId); res.json(dao.enrollUserInCourse(userId, courseId));
  });
  app.delete("/api/users/:userId/courses/:courseId", (req, res) => {
    const userId = requestedUserId(req, db), courseId = param(req, "courseId");
    requireCourse(db, courseId); dao.unenrollUserFromCourse(userId, courseId); res.sendStatus(200);
  });
  app.get("/api/courses/:courseId/users", (req, res) => {
    currentUser(req, db);
    const courseId = param(req, "courseId"); requireCourse(db, courseId);
    const ids = new Set(db.enrollments.filter((item) => item.course === courseId).map((item) => item.user));
    res.json(db.users.filter((user) => ids.has(user._id)).map(publicUser));
  });
}
