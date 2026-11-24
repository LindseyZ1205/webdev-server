import { randomUUID } from "node:crypto";
import type { Database, User } from "../types";
export default function UsersDao(db: Database) {
  return {
    findAllUsers: () => db.users,
    findUserById: (id: string) => db.users.find((user) => user._id === id),
    findUserByUsername: (username: string) => db.users.find((user) => user.username === username),
    findUserByCredentials: (username: string, password: string) => db.users.find((user) => user.username === username && user.password === password),
    createUser: (input: Omit<User, "_id">) => {
      const user = { ...input, _id: randomUUID() }; db.users.push(user); return user;
    },
    updateUser: (id: string, patch: Partial<User>) => {
      const user = db.users.find((item) => item._id === id);
      if (user) Object.assign(user, patch, { _id: id }); return user;
    },
    deleteUser: (id: string) => {
      db.users = db.users.filter((item) => item._id !== id);
      db.enrollments = db.enrollments.filter((item) => item.user !== id);
    },
  };
}
