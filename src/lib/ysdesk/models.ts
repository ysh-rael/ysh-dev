import type { ObjectId } from "mongodb";

export interface UserRecord {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  master: boolean;
  createdAt: Date;
  deviceRevision: number;
}

export interface DeviceRecord {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  activationCode: string;
  status: "active" | "removed";
  createdAt: Date;
  removedAt?: Date;
}

export interface LicenseRecord {
  _id: ObjectId;
  userId: ObjectId;
  paymentId: string;
  machineCount: number;
  amountCents: number;
  purchasedAt: Date;
  expiresAt: Date;
}

export interface PaymentRecord {
  _id: ObjectId;
  externalReference: string;
  userId: ObjectId;
  planId: string;
  machineCount: number;
  amountCents: number;
  status: string;
  createdAt: Date;
  mercadoPagoId?: string;
  statusDetail?: string;
  paidAt?: Date;
  pixCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
}

export function toPublicUser(user: UserRecord) {
  return {
    id: user._id.toHexString(),
    email: user.email,
    master: user.master === true,
    createdAt: user.createdAt.toISOString(),
  };
}