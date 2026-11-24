import { randomUUID } from "node:crypto";
import type { Course, Database } from "../types";
export default function CoursesDao(db: Database) {
  return {
    findAllCourses: () => db.courses,
    createCourse: (input: Omit<Course, "_id">) => {
      const course = { ...input, _id: randomUUID() }; db.courses.push(course); return course;
    },
    updateCourse: (id: string, patch: Partial<Course>) => {
      const course = db.courses.find((item) => item._id === id);
      if (course) Object.assign(course, patch, { _id: id }); return course;
    },
    deleteCourse: (id: string) => {
      db.courses = db.courses.filter((item) => item._id !== id);
      db.enrollments = db.enrollments.filter((item) => item.course !== id);
      db.modules = db.modules.filter((item) => item.course !== id);
      db.assignments = db.assignments.filter((item) => item.course !== id);
    },
  };
}
