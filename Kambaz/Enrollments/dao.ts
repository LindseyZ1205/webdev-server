import { randomUUID } from "node:crypto";
import type { Database } from "../types";
export default function EnrollmentsDao(db: Database) {
  return {
    enrollUserInCourse: (user: string, course: string) => {
      const existing = db.enrollments.find((item) => item.user === user && item.course === course);
      if (existing) return existing;
      const enrollment = { _id: randomUUID(), user, course };
      db.enrollments.push(enrollment); return enrollment;
    },
    unenrollUserFromCourse: (user: string, course: string) => {
      db.enrollments = db.enrollments.filter((item) => !(item.user === user && item.course === course));
    },
  };
}
