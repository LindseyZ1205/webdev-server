import { randomUUID } from "node:crypto";
import type { CourseModule, Database } from "../types";
export default function ModulesDao(db: Database) {
  return {
    findModulesForCourse: (id: string) => db.modules.filter((module) => module.course === id),
    createModule: (input: Omit<CourseModule, "_id">) => {
      const module = { ...input, _id: randomUUID() }; db.modules.push(module); return module;
    },
    updateModule: (id: string, patch: Partial<CourseModule>) => {
      const module = db.modules.find((item) => item._id === id);
      if (module) Object.assign(module, patch, { _id: id, course: module.course }); return module;
    },
    deleteModule: (id: string) => { db.modules = db.modules.filter((item) => item._id !== id); },
  };
}
