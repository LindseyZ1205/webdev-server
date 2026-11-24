import type { Express } from "express";
import { HttpError, param } from "../Kambaz/http";
export function booleanValue(value: unknown): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new HttpError(400, "Completed must be true or false");
}
export default function WorkingWithRemoteObjects(app: Express) {
  const assignment = {
    id: 1, title: "NodeJS Assignment", description: "Create a NodeJS server with ExpressJS",
    due: "2021-10-10", completed: false, score: 0,
  };
  const module = { id: "module-1", name: "HTTP APIs", description: "Practice Express routes", course: "1234" };
  app.get("/lab5/assignment", (_req, res) => { res.json(assignment); });
  app.get("/lab5/assignment/title", (_req, res) => { res.json(assignment.title); });
  app.get("/lab5/assignment/title/:newTitle", (req, res) => {
    assignment.title = param(req, "newTitle").trim(); res.json(assignment);
  });
  app.get("/lab5/assignment/score/:score", (req, res) => {
    const score = Number(param(req, "score"));
    if (!Number.isFinite(score) || score < 0) throw new HttpError(400, "Score must be a nonnegative number");
    assignment.score = score; res.json(assignment);
  });
  app.get("/lab5/assignment/completed/:completed", (req, res) => {
    assignment.completed = booleanValue(req.params.completed); res.json(assignment);
  });
  app.get("/lab5/module", (_req, res) => { res.json(module); });
  app.get("/lab5/module/name", (_req, res) => { res.json(module.name); });
  app.get("/lab5/module/name/:name", (req, res) => {
    module.name = param(req, "name").trim(); res.json(module);
  });
  app.get("/lab5/module/description/:description", (req, res) => {
    module.description = param(req, "description"); res.json(module);
  });
}
