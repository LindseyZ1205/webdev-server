import type { Express, Request, Response } from "express";
import type { Course, Database } from "../types";
import { body, currentUser, param, requireCourse, requireFaculty, text } from "../http";
import CoursesDao from "./dao";
import EnrollmentsDao from "../Enrollments/dao";
export default function CourseRoutes(app: Express, db: Database) {
  const dao = CoursesDao(db), enrollments = EnrollmentsDao(db);
  const readCourse = (req: Request, creating = false) => {
    const input = body(req), patch: Partial<Course> = {};
    for (const field of ["name", "subtitle", "description", "image", "number", "startDate"] as const) {
      if (input[field] !== undefined) patch[field] = text(input[field], field, field === "name");
    }
    if (creating) patch.name = text(input.name, "Name", true).trim();
    return patch;
  };
  const createCourse = (req: Request, res: Response) => {
    const user = currentUser(req, db);
    const course = dao.createCourse({ name: "", subtitle: "", description: "", image: "/images/reactjs.svg", number: "", startDate: "", ...readCourse(req, true) });
    enrollments.enrollUserInCourse(user._id, course._id); res.status(201).json(course);
  };
  app.get("/api/courses", (_req, res) => { res.json(dao.findAllCourses()); });
  app.get("/api/courses/:courseId", (req, res) => { res.json(requireCourse(db, param(req, "courseId"))); });
  app.post("/api/users/current/courses", requireFaculty(db), createCourse);
  app.post("/api/courses", requireFaculty(db), createCourse);
  app.put("/api/courses/:courseId", requireFaculty(db), (req, res) => {
    const id = param(req, "courseId"); requireCourse(db, id); res.json(dao.updateCourse(id, readCourse(req)));
  });
  app.delete("/api/courses/:courseId", requireFaculty(db), (req, res) => {
    const id = param(req, "courseId"); requireCourse(db, id); dao.deleteCourse(id); res.sendStatus(200);
  });
}
