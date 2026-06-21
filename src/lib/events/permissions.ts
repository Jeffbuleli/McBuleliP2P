import { UserRole, type UserRoleType } from "@/lib/roles";
import {
  EventRole,
  type EventRoleValue,
  type EventRecord,
} from "@/lib/events/types";

export function resolveEventRole(args: {
  userId: string;
  appRole: UserRoleType;
  event?: Pick<EventRecord, "trainerId" | "createdBy"> | null;
}): EventRoleValue {
  if (args.appRole === UserRole.SUPER_ADMIN) return EventRole.SYSTEM_ADMIN;
  if (args.event?.trainerId === args.userId || args.event?.createdBy === args.userId) {
    return EventRole.TRAINER;
  }
  return EventRole.STUDENT;
}

export function canManageEvents(role: EventRoleValue): boolean {
  return (
    role === EventRole.SYSTEM_ADMIN ||
    role === EventRole.ACADEMY_ADMIN ||
    role === EventRole.TRAINER
  );
}

export function canEditEvent(args: {
  role: EventRoleValue;
  userId: string;
  event: Pick<EventRecord, "trainerId" | "createdBy">;
}): boolean {
  if (args.role === EventRole.SYSTEM_ADMIN || args.role === EventRole.ACADEMY_ADMIN) {
    return true;
  }
  if (args.role === EventRole.TRAINER) {
    return args.event.trainerId === args.userId || args.event.createdBy === args.userId;
  }
  return false;
}

export function canViewEvent(args: {
  role: EventRoleValue;
  userId: string;
  event: Pick<EventRecord, "trainerId" | "createdBy"> & {
    visibility: string;
    status: string;
  };
  enrolled: boolean;
}): boolean {
  if (args.event.status === "DRAFT") {
    return canEditEvent({
      role: args.role,
      userId: args.userId,
      event: args.event,
    });
  }
  if (args.event.visibility === "PRIVATE") {
    return (
      canEditEvent({ role: args.role, userId: args.userId, event: args.event }) ||
      args.enrolled
    );
  }
  return true;
}
