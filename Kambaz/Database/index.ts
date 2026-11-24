import courseSeed from "./courses.json";
import moduleSeed from "./modules.json";
import assignmentSeed from "./assignments.json";
import enrollmentSeed from "./enrollments.json";
import userSeed from "./users.json";
import type { Assignment, Database, User } from "../types";

export const assignmentDefaults: Assignment = {
  _id: "", course: "", title: "", details: "", description: "", points: 100,
  due: "", availableFrom: "", availableUntil: "", group: "ASSIGNMENTS",
  gradeDisplay: "Percentage", submissionType: "Online", entryOptions: ["website-url"],
  assignTo: "Everyone", notes: "",
};

// A fresh copy belongs to each server instance. Restarting resets Chapter 5 data.
export default function createDatabase(): Database {
  return {
    users: structuredClone(userSeed) as User[],
    courses: courseSeed.map((course) => ({
      ...course, description: course.subtitle,
      number: course.name.split(" ")[0], startDate: "",
    })),
    modules: structuredClone(moduleSeed).map((module) => ({ ...module, name: module.title })),
    assignments: assignmentSeed.map((assignment) => ({ ...structuredClone(assignmentDefaults), ...assignment })),
    enrollments: structuredClone(enrollmentSeed),
  };
}
