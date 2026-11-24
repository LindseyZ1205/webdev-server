import type { Express } from "express";
import { HttpError } from "../Kambaz/http";

export function calculate(operation: unknown, rawA: unknown, rawB: unknown): number {
  if (typeof rawA !== "string" || typeof rawB !== "string" || !rawA.trim() || !rawB.trim()) {
    throw new HttpError(400, "Both a and b are required numbers");
  }
  const a = Number(rawA), b = Number(rawB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new HttpError(400, "Both a and b must be finite numbers");
  let result: number;
  switch (operation) {
    case "add": result = a + b; break;
    case "subtract": result = a - b; break;
    case "multiply": result = a * b; break;
    case "divide":
      if (b === 0) throw new HttpError(400, "Cannot divide by zero");
      result = a / b; break;
    default: throw new HttpError(400, "Invalid operation");
  }
  if (!Number.isFinite(result)) throw new HttpError(400, "Result is outside the supported number range");
  return result;
}
export default function PathParameters(app: Express) {
  for (const operation of ["add", "subtract", "multiply", "divide"]) {
    app.get(`/lab5/${operation}/:a/:b`, (req, res) => {
      res.send(String(calculate(operation, req.params.a, req.params.b)));
    });
  }
}
