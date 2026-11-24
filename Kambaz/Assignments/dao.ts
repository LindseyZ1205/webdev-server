import { randomUUID } from "node:crypto";
import type { Assignment, Database } from "../types";
export default function AssignmentsDao(db: Database) {
  return {
    findAssignmentsForCourse: (id: string) => db.assignments.filter((assignment) => assignment.course === id),
    createAssignment: (input: Omit<Assignment, "_id">) => {
      const assignment = { ...input, _id: randomUUID() }; db.assignments.push(assignment); return assignment;
    },
    updateAssignment: (id: string, patch: Partial<Assignment>) => {
      const assignment = db.assignments.find((item) => item._id === id);
      if (assignment) Object.assign(assignment, patch, { _id: id, course: assignment.course }); return assignment;
    },
    deleteAssignment: (id: string) => { db.assignments = db.assignments.filter((item) => item._id !== id); },
  };
}
