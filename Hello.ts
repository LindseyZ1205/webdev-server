import type { Express } from "express";
export default function Hello(app: Express) {
  app.get("/", (_req, res) => { res.send("Welcome to Full Stack Development!"); });
  app.get("/hello", (_req, res) => { res.send("Life is good!"); });
}
