import type { Express } from "express";
import { calculate } from "./PathParameters";
export default function QueryParameters(app: Express) {
  app.get("/lab5/calculator", (req, res) => {
    res.send(String(calculate(req.query.operation, req.query.a, req.query.b)));
  });
}
