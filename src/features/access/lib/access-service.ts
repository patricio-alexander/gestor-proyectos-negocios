import bcrypt from "bcryptjs";
import { prisma } from "@/src/shared/lib/prisma";
import type {
  CreateUserInput,
  ProfileInput,
  RoleRecord,
  UpdateUserInput,
  UserRecord,
} from "@/src/features/access/types";

function mapRole(row: {
  id: number;
  key: string;
  name: string;
  description: string | null;
  _count?: { users: number };
}): RoleRecord {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    user_count: row._count?.users,
  };
}

function mapUser(row: {
  id: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  created_at: Date;
  roles: Array<{ role: { id: number; key: string; name: string; description: string | null } }>;
}): UserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at.toISOString(),
    roles: row.roles.map((r) => mapRole(r.role)),
  };
}

const userInclude = {
  roles: { include: { role: true } },
};

export async function listRoles(): Promise<RoleRecord[]> {
  const rows = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return rows.map(mapRole);
}

export async function createRole(input: { key: string; name: string; description?: string }) {
  const row = await prisma.role.create({
    data: {
      key: input.key.trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
    include: { _count: { select: { users: true } } },
  });
  return mapRole(row);
}

export async function updateRole(
  id: number,
  input: { key?: string; name?: string; description?: string },
) {
  const row = await prisma.role.update({
    where: { id },
    data: {
      ...(input.key != null ? { key: input.key.trim() } : {}),
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
    },
    include: { _count: { select: { users: true } } },
  });
  return mapRole(row);
}

export async function deleteRole(id: number) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return null;
  if (["programador", "admin", "operator"].includes(role.key)) {
    throw Object.assign(new Error("No se pueden eliminar roles del sistema"), { statusCode: 400 });
  }
  await prisma.role.delete({ where: { id } });
  return role;
}

export async function listUsers(excludeUserId?: string): Promise<UserRecord[]> {
  const rows = await prisma.user.findMany({
    where: {
      deleted_at: null,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    include: userInclude,
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapUser);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const row = await prisma.user.findFirst({
    where: { id, deleted_at: null },
    include: userInclude,
  });
  return row ? mapUser(row) : null;
}

async function syncUserRoles(userId: string, roleIds: number[]) {
  await prisma.userRole.deleteMany({ where: { user_id: userId } });
  if (!roleIds.length) return;
  await prisma.userRole.createMany({
    data: roleIds.map((role_id) => ({ user_id: userId, role_id })),
  });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findFirst({ where: { username: input.username.trim() } });
  if (existing) throw Object.assign(new Error("El nombre de usuario ya está en uso"), { statusCode: 409 });

  const hash = await bcrypt.hash(input.password.trim(), 10);
  const user = await prisma.user.create({
    data: {
      username: input.username.trim(),
      email: input.email?.trim() || null,
      display_name: input.display_name?.trim() || null,
      password: hash,
    },
    include: userInclude,
  });

  if (input.role_ids?.length) {
    await syncUserRoles(user.id, input.role_ids);
    return getUserById(user.id);
  }
  return mapUser(user);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const data: Record<string, unknown> = {};
  if (input.username != null) data.username = input.username.trim();
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.display_name !== undefined) data.display_name = input.display_name?.trim() || null;
  if (input.password?.trim()) data.password = await bcrypt.hash(input.password.trim(), 10);

  await prisma.user.update({ where: { id }, data });

  if (input.role_ids !== undefined) {
    await syncUserRoles(id, input.role_ids);
  }

  return getUserById(id);
}

export async function deleteUser(id: string, requestingUserId?: string) {
  if (requestingUserId && requestingUserId === id) {
    throw Object.assign(new Error("No puedes eliminar tu propia cuenta"), { statusCode: 403 });
  }
  await prisma.user.update({ where: { id }, data: { deleted_at: new Date() } });
}

export async function updateProfile(userId: string, input: ProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("Usuario no encontrado"), { statusCode: 404 });

  if (input.password) {
    if (!input.current_password || !user.password) {
      throw Object.assign(new Error("Contraseña actual requerida"), { statusCode: 400 });
    }
    const ok = await bcrypt.compare(input.current_password, user.password);
    if (!ok) throw Object.assign(new Error("Contraseña actual incorrecta"), { statusCode: 401 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.display_name !== undefined ? { display_name: input.display_name.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email.trim() || null } : {}),
      ...(input.password ? { password: await bcrypt.hash(input.password.trim(), 10) } : {}),
    },
  });

  return getUserById(userId);
}
