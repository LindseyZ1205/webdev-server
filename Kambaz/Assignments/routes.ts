import type { Express, Request } from "express";
import type { Assignment, Database } from "../types";
import { assignmentDefaults } from "../Database";
import { body, HttpError, param, requireCourse, requireFaculty, text } from "../http";
import AssignmentsDao from "./dao";
export default function AssignmentRoutes(app: Express, db: Database) {
  const dao = AssignmentsDao(db);
  const find = (id: string) => {
    const assignment = db.assignments.find((item) => item._id === id);
    if (!assignment) throw new HttpError(404, "Assignment not found"); return assignment;
  };
  const readAssignment = (req: Request, creating = false) => {
    const input = body(req), patch: Partial<Assignment> = {};
    for (const field of ["title", "details", "description", "due", "availableFrom", "availableUntil", "group", "gradeDisplay", "submissionType", "assignTo", "notes"] as const) {
      if (input[field] !== undefined) patch[field] = text(input[field], field, field === "title");
    }
    if (creating) patch.title = text(input.title, "Title", true).trim();
    if (input.points !== undefined) {
      if (typeof input.points !== "number" || !Number.isFinite(input.points) || input.points < 0) throw new HttpError(400, "Points must be a nonnegative number");
      patch.points = input.points;
    }
    if (input.entryOptions !== undefined) {
      if (!Array.isArray(input.entryOptions) || !input.entryOptions.every((option) => typeof option === "string")) throw new HttpError(400, "Entry options must be an array of strings");
      patch.entryOptions = input.entryOptions;
    }
    return patch;
  };
  app.get("/api/courses/:courseId/assignments", (req, res) => {
    const id = param(req, "courseId"); requireCourse(db, id); res.json(dao.findAssignmentsForCourse(id));
  });
  app.get("/api/assignments/:assignmentId", (req, res) => { res.json(find(param(req, "assignmentId"))); });
  app.post("/api/courses/:courseId/assignments", requireFaculty(db), (req, res) => {
    const course = param(req, "courseId"); requireCourse(db, course);
    res.status(201).json(dao.createAssignment({ ...structuredClone(assignmentDefaults), ...readAssignment(req, true), course }));
  });
  app.put("/api/assignments/:assignmentId", requireFaculty(db), (req, res) => {
    const id = param(req, "assignmentId"); find(id); res.json(dao.updateAssignment(id, readAssignment(req)));
  });
  app.delete("/api/assignments/:assignmentId", requireFaculty(db), (req, res) => {
    const id = param(req, "assignmentId"); find(id); dao.deleteAssignment(id); res.sendStatus(200);
  });
}
