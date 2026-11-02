export type DeskUser = { id: string; email: string; master: boolean; createdAt: string };
export type DeskDevice = { id: string; name: string; connected: boolean; activationPending: boolean; lastSeenAt: string | null; createdAt: string };
export type DeskLicense = {
    id: string;
    machineCount: number;
    amountCents: number;
    purchasedAt: string;
    expiresAt: string;
};
export type AccountData = {
    user: DeskUser;
    devices: DeskDevice[];
    licenses: DeskLicense[];
    seats: { total: number; used: number; available: number };
};
export type PaymentData = {
    id: string;
    planName?: string;
    machineCount: number;
    amountCents: number;
    status: string;
    pixCode: string | null;
    pixQrCodeBase64: string | null;
    ticketUrl: string | null;
};
export type AdminData = {
    stats: {
        users: number;
        activeLicenses: number;
        activeMachines: number;
        sales: number;
        revenueCents: number;
        monthRevenueCents: number;
    };
    users: Array<{ id: string; email: string; master: boolean; createdAt: string }>;
    licenses: Array<{
        id: string;
        email: string;
        machineCount: number;
        amountCents: number;
        purchasedAt: string;
        expiresAt: string;
        active: boolean;
    }>;
};