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
  activationCode?: string;
  activationCodeHash?: string;
  activationExpiresAt?: Date;
  status: "active" | "removed";
  createdAt: Date;
  removedAt?: Date;
  installationId?: string;
  publicKeySpki?: string;
  publicKeyFingerprint?: string;
  activatedAt?: Date;
  lastSeenAt?: Date;
  presenceState?: "ready" | "busy" | "offline";
}

export interface CentralTokenRecord {
  _id?: ObjectId;
  tokenHash: string;
  installationId: string;
  deviceId: ObjectId;
  userId: ObjectId;
  scopes: string[];
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface CentralSessionRecord {
  _id?: ObjectId;
  sessionId: string;
  hostInstallationId: string;
  viewerInstallationId: string;
  hostDeviceId: ObjectId;
  viewerDeviceId: ObjectId;
  requestedCapabilities: string[];
  state: "pending" | "accepted" | "rejected" | "connected" | "closed" | "expired";
  createdAt: Date;
  expiresAt: Date;
  connectedAt?: Date;
  closedAt?: Date;
}

export interface RelayTicketRecord {
  _id?: ObjectId;
  tokenHash: string;
  sessionId: string;
  installationId: string;
  role: "host" | "viewer";
  expiresAt: Date;
  usedAt?: Date;
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