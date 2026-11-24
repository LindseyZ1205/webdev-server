import type { Express } from "express";
import type { Database } from "../types";
import { body, HttpError, param, requireCourse, requireFaculty, text } from "../http";
import ModulesDao from "./dao";
export default function ModuleRoutes(app: Express, db: Database) {
  const dao = ModulesDao(db);
  const find = (id: string) => {
    const module = db.modules.find((item) => item._id === id);
    if (!module) throw new HttpError(404, "Module not found"); return module;
  };
  app.get("/api/courses/:courseId/modules", (req, res) => {
    const id = param(req, "courseId"); requireCourse(db, id); res.json(dao.findModulesForCourse(id));
  });
  app.post("/api/courses/:courseId/modules", requireFaculty(db), (req, res) => {
    const course = param(req, "courseId"); requireCourse(db, course);
    const input = body(req), title = text(input.title ?? input.name, "Module name", true).trim();
    res.status(201).json(dao.createModule({ course, title, name: title, lessons: [] }));
  });
  app.put("/api/modules/:moduleId", requireFaculty(db), (req, res) => {
    const id = param(req, "moduleId"); find(id);
    const input = body(req), title = text(input.title ?? input.name, "Module name", true).trim();
    res.json(dao.updateModule(id, { title, name: title }));
  });
  app.delete("/api/modules/:moduleId", requireFaculty(db), (req, res) => {
    const id = param(req, "moduleId"); find(id); dao.deleteModule(id); res.sendStatus(200);
  });
}
