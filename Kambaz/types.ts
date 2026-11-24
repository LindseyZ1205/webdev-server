export type Role = "STUDENT" | "FACULTY" | "ADMIN";
export type User = {
  _id: string; username: string; password: string; firstName: string;
  lastName: string; email: string; role: Role; dob: string;
};
export type PublicUser = Omit<User, "password">;
export type Course = {
  _id: string; name: string; subtitle: string; description: string; image: string;
  number: string; startDate: string;
};
export type Lesson = { _id: string; title: string; items: string[] };
export type CourseModule = {
  _id: string; course: string; title: string; name: string; lessons: Lesson[];
};
export type Assignment = {
  _id: string; course: string; title: string; details: string; description: string;
  points: number; due: string; availableFrom: string; availableUntil: string;
  group: string; gradeDisplay: string; submissionType: string; entryOptions: string[];
  assignTo: string; notes: string;
};
export type Enrollment = { _id: string; user: string; course: string };
export type Database = {
  users: User[]; courses: Course[]; modules: CourseModule[];
  assignments: Assignment[]; enrollments: Enrollment[];
};
