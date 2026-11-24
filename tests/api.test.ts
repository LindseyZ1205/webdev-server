import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import createApp from "../app";

let server: Server, base: string;
before(async () => {
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); });
async function api(path: string, method = "GET", payload?: unknown, cookie?: string) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(payload === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const raw = await response.text();
  return { status: response.status, data: response.headers.get("content-type")?.includes("json") ? JSON.parse(raw) : raw,
    cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function signin(username: string, password: string) {
  const response = await api("/api/users/signin", "POST", { username, password });
  assert.equal(response.status, 200); assert.ok(response.cookie); assert.equal(response.data.password, undefined);
  return response.cookie!;
}

test("Lab greetings and both calculator URL shapes use supplied values", async () => {
  assert.equal((await api("/")).data, "Welcome to Full Stack Development!");
  assert.equal((await api("/hello")).data, "Life is good!");
  assert.equal((await api("/lab5/welcome")).data, "Welcome to Lab 5");
  for (const [operation, expected] of [["add", 23], ["subtract", 15], ["multiply", 76], ["divide", 4.75]]) {
    assert.equal((await api(`/lab5/${operation}/19/4`)).data, String(expected));
    assert.equal((await api(`/lab5/calculator?operation=${operation}&a=19&b=4`)).data, String(expected));
  }
  assert.equal((await api("/lab5/divide/4/0")).status, 400);
  assert.equal((await api("/lab5/calculator?operation=add&a=no&b=2")).status, 400);
  assert.equal((await api("/lab5/calculator?operation=unknown&a=1&b=2")).status, 400);
});

test("Remote assignment and module edits persist across reads", async () => {
  assert.equal((await api("/lab5/assignment")).data.id, 1);
  await api("/lab5/assignment/title/Review%20HTTP");
  assert.equal((await api("/lab5/assignment/title")).data, "Review HTTP");
  await api("/lab5/assignment/score/95");
  await api("/lab5/assignment/completed/false");
  assert.equal((await api("/lab5/assignment")).data.score, 95);
  assert.equal((await api("/lab5/assignment")).data.completed, false);
  await api("/lab5/module/name/Node%20routes");
  await api("/lab5/module/description/HTTP%20practice");
  assert.equal((await api("/lab5/module/name")).data, "Node routes");
  assert.equal((await api("/lab5/module")).data.description, "HTTP practice");
});

test("Todos support filtering, all GET demonstrations, CRUD and truthful 404s", async () => {
  const completed = (await api("/lab5/todos?completed=true")).data;
  assert.equal(completed.length, 2); assert.ok(completed.every((todo: { completed: boolean }) => todo.completed));
  assert.equal((await api("/lab5/todos/1")).data.id, 1);
  await api("/lab5/todos/1/title/First%20task");
  await api("/lab5/todos/1/completed/true");
  await api("/lab5/todos/1/description/Read%20chapter");
  assert.equal((await api("/lab5/todos/1")).data.description, "Read chapter");
  const list = (await api("/lab5/todos/create")).data;
  const id = list.at(-1).id;
  assert.equal((await api(`/lab5/todos/${id}/delete`)).status, 200);
  assert.equal((await api(`/lab5/todos/${id}`, "DELETE")).status, 404);
  const created = await api("/lab5/todos", "POST", { title: "API test", completed: false, id: 1 });
  assert.equal(created.status, 201); assert.notEqual(created.data.id, 1);
  const updated = await api(`/lab5/todos/${created.data.id}`, "PUT", { title: "Saved", completed: true, id: 999 });
  assert.equal(updated.data.id, created.data.id); assert.equal(updated.data.completed, true);
  assert.equal((await api(`/lab5/todos/${created.data.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/lab5/todos/${created.data.id}`, "PUT", { title: "Gone" })).status, 404);
  assert.equal((await api("/lab5/todos?completed=maybe")).status, 400);
});

test("Sessions isolate browsers, recover profile, deny student writes, and sign out", async () => {
  assert.equal((await api("/api/users/profile")).status, 401);
  assert.equal((await api("/api/users/signin", "POST", { username: "iron_man", password: "wrong" })).status, 401);
  const student = await signin("iron_man", "stark123"), faculty = await signin("nick_fury", "fury123");
  assert.equal((await api("/api/users/profile", "GET", undefined, student)).data._id, "iron_man");
  assert.equal((await api("/api/users/profile", "GET", undefined, faculty)).data._id, "nick_fury");
  assert.equal((await api("/api/users/current/courses", "GET", undefined, student)).data.length, 2);
  assert.equal((await api("/api/courses", "POST", { name: "Unauthorized" }, student)).status, 403);
  const profile = await api("/api/users/iron_man", "PUT", { firstName: "Tony Updated", role: "FACULTY", _id: "changed" }, student);
  assert.equal(profile.data._id, "iron_man"); assert.equal(profile.data.role, "STUDENT");
  assert.equal((await api("/api/users/profile", "GET", undefined, student)).data.firstName, "Tony Updated");
  assert.equal((await api("/api/users/nick_fury", "PUT", { firstName: "No" }, student)).status, 403);
  await api("/api/users/signout", "POST", {}, student);
  assert.equal((await api("/api/users/profile", "GET", undefined, student)).status, 401);
});

test("Kambaz CRUD preserves identities and course ownership, and deletes dependents", async () => {
  const faculty = await signin("nick_fury", "fury123");
  const list = (await api("/api/courses")).data;
  assert.ok(list.length >= 3);
  const reactModules = (await api("/api/courses/1234/modules")).data;
  const nodeModules = (await api("/api/courses/2345/modules")).data;
  assert.ok(reactModules.length && nodeModules.length);
  assert.ok(reactModules.every((module: { course: string }) => module.course === "1234"));
  assert.notDeepEqual(reactModules, nodeModules);
  const course = (await api("/api/users/current/courses", "POST", { name: "Test course", _id: "ignore" }, faculty)).data;
  assert.notEqual(course._id, "ignore");
  assert.ok((await api("/api/users/current/courses", "GET", undefined, faculty)).data.some((item: { _id: string }) => item._id === course._id));
  await api(`/api/courses/${course._id}`, "PUT", { name: "Updated course", _id: "ignore" }, faculty);
  assert.equal((await api(`/api/courses/${course._id}`)).data.name, "Updated course");
  const module = (await api(`/api/courses/${course._id}/modules`, "POST", { title: "Module one", course: "1234" }, faculty)).data;
  assert.equal(module.course, course._id);
  const savedModule = (await api(`/api/modules/${module._id}`, "PUT", { title: "Renamed", course: "1234" }, faculty)).data;
  assert.equal(savedModule.course, course._id); assert.equal(savedModule.name, "Renamed");
  const assignment = (await api(`/api/courses/${course._id}/assignments`, "POST", { title: "New homework", points: 20, course: "1234" }, faculty)).data;
  assert.equal(assignment.course, course._id);
  await api(`/api/assignments/${assignment._id}`, "PUT", { title: "Saved homework", points: 25, _id: "changed", course: "1234" }, faculty);
  assert.equal((await api(`/api/assignments/${assignment._id}`)).data.course, course._id);
  assert.equal((await api(`/api/assignments/${assignment._id}`)).data.points, 25);
  await api(`/api/courses/${course._id}`, "DELETE", undefined, faculty);
  assert.equal((await api(`/api/courses/${course._id}`)).status, 404);
  assert.equal((await api(`/api/assignments/${assignment._id}`)).status, 404);
  assert.ok(!(await api("/api/enrollments", "GET", undefined, faculty)).data.some((item: { course: string }) => item.course === course._id));
});

test("Signup, enrollment and People use server IDs without deleting another account", async () => {
  const username = `test-${Date.now()}`;
  const signup = await api("/api/users/signup", "POST", { username, password: "demo-only", role: "ADMIN", _id: "override" });
  assert.equal(signup.status, 201); assert.equal(signup.data.role, "STUDENT"); assert.notEqual(signup.data._id, "override");
  assert.equal((await api("/api/users/signup", "POST", { username, password: "duplicate" })).status, 400);
  const student = signup.cookie!, id = signup.data._id;
  const first = (await api("/api/users/current/courses/1234", "POST", {}, student)).data;
  const second = (await api("/api/users/current/courses/1234", "POST", {}, student)).data;
  assert.equal(first._id, second._id);
  assert.ok((await api("/api/courses/1234/users", "GET", undefined, student)).data.some((user: { _id: string }) => user._id === id));
  assert.equal((await api("/api/users/iron_man/courses/1234", "DELETE", undefined, student)).status, 403);
  await api("/api/users/current/courses/1234", "DELETE", undefined, student);
  assert.equal((await api("/api/users/profile", "GET", undefined, student)).data._id, id);
  assert.equal((await api("/api/users/current/courses", "GET", undefined, student)).data.length, 0);
});

test("CORS allows the configured local client and rejects an unrelated origin", async () => {
  const allowed = await fetch(base + "/api/courses", { headers: { Origin: "http://localhost:3000" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  assert.equal((await fetch(base + "/api/courses", { headers: { Origin: "https://unrelated.example" } })).status, 403);
});
