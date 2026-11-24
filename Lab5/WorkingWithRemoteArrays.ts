import type { Express, Request } from "express";
import { HttpError, body, param, text } from "../Kambaz/http";
import { booleanValue } from "./WorkingWithRemoteObjects";
type Todo = { id: number; title: string; completed: boolean; description: string };
export default function WorkingWithRemoteArrays(app: Express) {
  let todos: Todo[] = [1, 2, 3, 4].map((id) => ({ id, title: `Task ${id}`, completed: id % 2 === 0, description: "" }));
  let nextId = 5;
  const find = (req: Request) => {
    const rawId = param(req, "id");
    if (!/^\d+$/.test(rawId)) throw new HttpError(404, `Todo ${rawId} not found`);
    const todo = todos.find((item) => item.id === Number(rawId));
    if (!todo) throw new HttpError(404, `Todo ${rawId} not found`);
    return todo;
  };
  const create = (input: Record<string, unknown>) => {
    const todo: Todo = {
      id: nextId++, title: input.title === undefined ? "New Task" : text(input.title, "Title", true).trim(),
      completed: input.completed === undefined ? false : booleanValue(input.completed),
      description: input.description === undefined ? "" : text(input.description, "Description"),
    };
    todos.push(todo); return todo;
  };
  const update = (todo: Todo, input: Record<string, unknown>) => {
    // Validate before mutation so a bad patch never partially changes a record.
    const patch: Partial<Todo> = {};
    if (input.title !== undefined) patch.title = text(input.title, "Title", true).trim();
    if (input.description !== undefined) patch.description = text(input.description, "Description");
    if (input.completed !== undefined) patch.completed = booleanValue(input.completed);
    Object.assign(todo, patch);
  };
  app.get("/lab5/todos", (req, res) => {
    const completed = req.query.completed;
    res.json(completed === undefined ? todos : todos.filter((todo) => todo.completed === booleanValue(completed)));
  });
  // The instructional GET mutation routes precede the generic /:id route.
  app.get("/lab5/todos/create", (_req, res) => { create({}); res.json(todos); });
  app.get("/lab5/todos/:id/delete", (req, res) => {
    const todo = find(req); todos = todos.filter((item) => item.id !== todo.id); res.json(todos);
  });
  app.get("/lab5/todos/:id/title/:title", (req, res) => {
    update(find(req), { title: param(req, "title") }); res.json(todos);
  });
  app.get("/lab5/todos/:id/completed/:completed", (req, res) => {
    update(find(req), { completed: req.params.completed }); res.json(todos);
  });
  app.get("/lab5/todos/:id/description/:description", (req, res) => {
    update(find(req), { description: param(req, "description") }); res.json(todos);
  });
  app.get("/lab5/todos/:id", (req, res) => { res.json(find(req)); });
  app.post("/lab5/todos", (req, res) => { res.status(201).json(create(body(req))); });
  app.put("/lab5/todos/:id", (req, res) => {
    const todo = find(req); update(todo, body(req)); res.json(todo);
  });
  app.delete("/lab5/todos/:id", (req, res) => {
    const todo = find(req); todos = todos.filter((item) => item.id !== todo.id); res.sendStatus(200);
  });
}
