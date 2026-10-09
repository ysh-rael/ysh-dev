import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  randomUUID,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";
import { createServer } from "node:http";
import { MongoClient } from "mongodb";
import WebSocket, { WebSocketServer } from "ws";

const CONTROL_PATH = "/v1/control";
const MAX_CONTROL_BYTES = 64 * 1024;
const CONTROL_TOKEN_SECONDS = 15 * 60;
const CHALLENGE_SECONDS = 60;
const ALLOWED_CAPABILITIES = new Set(["view_screen", "control_input", "send_file", "receive_file"]);
const rateLimits = new Map();
const activeConnections = new Map();
const pendingRelays = new Map();

const config = loadConfig();
const mongoClient = new MongoClient(config.mongoUri, { appName: "ysdesk-central" });
await mongoClient.connect();
const database = mongoClient.db(config.databaseName);
await ensureIndexes();

const controlWss = new WebSocketServer({ noServer: true, maxPayload: MAX_CONTROL_BYTES, perMessageDeflate: false });
const relayWss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024, perMessageDeflate: false });

const server = createServer((request, response) => {
  const pathname = new URL(request.url || "/", config.localOrigin).pathname;
  if (request.method === "GET" && pathname === "/v1/health") {
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ status: "ok", service: "ysdesk-central", protocol_version: 1 }));
    return;
  }
  response.writeHead(404, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ error: "not_found" }));
});

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "/", config.localOrigin).pathname;
  if (!isAllowedOrigin(request.headers.origin)) {
    rejectUpgrade(socket, 403, "Forbidden");
    return;
  }

  if (pathname === CONTROL_PATH) {
    if (!allowRate(`connect:${clientAddress(request)}`, 30, 60_000)) {
      rejectUpgrade(socket, 429, "Too Many Requests");
      return;
    }
    controlWss.handleUpgrade(request, socket, head, (webSocket) => {
      controlWss.emit("connection", webSocket, request);
    });
    return;
  }

  if (pathname === "/v1/session") {
    relayWss.handleUpgrade(request, socket, head, (webSocket) => {
      relayWss.emit("connection", webSocket, request);
    });
    return;
  }

  rejectUpgrade(socket, 404, "Not Found");
});

controlWss.on("connection", (webSocket, request) => {
  const connection = {
    webSocket,
    remoteAddress: clientAddress(request),
    inboundSequence: 0,
    outboundSequence: 0,
    messageIds: new Set(),
    pendingChallenge: null,
    token: null,
    device: null,
    installationId: null,
    closed: false,
  };

  webSocket.on("message", (data, isBinary) => {
    void handleControlMessage(connection, data, isBinary).catch(() => closeSocket(webSocket, 1011, "internal_error"));
  });

  webSocket.on("close", () => {
    void handleControlClose(connection);
  });

  webSocket.on("error", () => undefined);
});

relayWss.on("connection", (webSocket, request) => {
  void handleRelayConnection(webSocket, request).catch(() => closeSocket(webSocket, 1008, "relay_rejected"));
});

const expiryTimer = setInterval(() => {
  void expirePendingSessions().catch(() => undefined);
}, 5_000);
expiryTimer.unref();

const rateLimitTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) rateLimits.delete(key);
  }
}, 60_000);
rateLimitTimer.unref();

server.listen(config.port, config.host, () => {
  console.log(`[ysdesk-central] listening on ${config.host}:${config.port}`);
});

function loadConfig() {
  const mongoUri = process.env.MONGODB_URI;
  const relaySecret = process.env.YS_DESK_RELAY_SECRET;
  const privateKeyBase64 = process.env.YS_DESK_LICENSE_PRIVATE_KEY_BASE64;
  const licenseKeyId = process.env.YS_DESK_LICENSE_KEY_ID;
  const centralOrigin = process.env.YS_DESK_CENTRAL_ORIGIN || "http://localhost:3002";
  const parsedOrigin = new URL(centralOrigin);
  const production = process.env.NODE_ENV === "production";

  if (!mongoUri) throw new Error("MONGODB_URI is required.");
  if (!relaySecret || Buffer.byteLength(relaySecret) < 32 || /^(replace-with|change-me|your-secret)/i.test(relaySecret.trim())) {
    throw new Error("YS_DESK_RELAY_SECRET must be a non-placeholder secret of at least 32 bytes.");
  }
  if (!privateKeyBase64 || !licenseKeyId) throw new Error("A license signing key and key id are required.");
  if (production && (parsedOrigin.protocol !== "https:" || process.env.YS_DESK_CENTRAL_TRUST_PROXY !== "true")) {
    throw new Error("Production central service must use HTTPS behind a trusted TLS proxy.");
  }

  const licensePrivateKey = createPrivateKey(Buffer.from(privateKeyBase64, "base64").toString("utf8"));
  if (licensePrivateKey.asymmetricKeyType !== "ed25519") throw new Error("License signing key must use Ed25519.");

  return {
    mongoUri,
    databaseName: process.env.MONGODB_DB || "ysdesk",
    relaySecret,
    licensePrivateKey,
    licenseKeyId,
    issuer: parsedOrigin.origin,
    centralOrigin: parsedOrigin.origin,
    relayEndpoint: `${parsedOrigin.protocol === "https:" ? "wss:" : "ws:"}//${parsedOrigin.host}/v1/session`,
    localOrigin: parsedOrigin.origin,
    host: process.env.YS_DESK_CENTRAL_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.YS_DESK_CENTRAL_PORT || "3002", 10),
    allowedOrigins: new Set([
      process.env.YS_DESK_APP_URL,
      process.env.YS_DESK_WEB_ORIGIN,
      parsedOrigin.origin,
    ].filter(Boolean).map((value) => new URL(value).origin)),
    production,
    trustProxy: process.env.YS_DESK_CENTRAL_TRUST_PROXY === "true",
  };
}

async function ensureIndexes() {
  await Promise.all([
    database.collection("devices").createIndex({ installationId: 1 }, { unique: true, sparse: true }),
    database.collection("devices").createIndex({ activationCodeHash: 1 }, { unique: true, sparse: true }),
    database.collection("centralTokens").createIndex({ tokenHash: 1 }, { unique: true }),
    database.collection("centralTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("centralSessions").createIndex({ sessionId: 1 }, { unique: true }),
    database.collection("centralSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("centralSessionLocks").createIndex({ installationId: 1 }, { unique: true }),
    database.collection("centralSessionLocks").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("relayTickets").createIndex({ tokenHash: 1 }, { unique: true }),
    database.collection("relayTickets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

async function handleControlMessage(connection, data, isBinary) {
  if (isBinary || connection.webSocket.readyState !== WebSocket.OPEN) {
    closeSocket(connection.webSocket, 1003, "text_messages_only");
    return;
  }

  const envelope = parseEnvelope(data, connection);
  if (!envelope) return;

  if (!connection.pendingChallenge && !connection.device) {
    if (envelope.type !== "client.hello") {
      closeSocket(connection.webSocket, 1008, "hello_required");
      return;
    }
    await beginChallenge(connection, envelope);
    return;
  }

  if (connection.pendingChallenge && !connection.device) {
    if (envelope.type !== "client.prove") {
      closeSocket(connection.webSocket, 1008, "proof_required");
      return;
    }
    await completeChallenge(connection, envelope);
    return;
  }

  const token = await authenticateEnvelope(connection, envelope);
  if (!token) {
    closeSocket(connection.webSocket, 1008, "authentication_required");
    return;
  }
  if (!allowRate(`messages:${connection.installationId}`, 180, 60_000)) {
    closeSocket(connection.webSocket, 1008, "rate_limited");
    return;
  }

  switch (envelope.type) {
    case "client.heartbeat":
      await handleHeartbeat(connection, envelope, token);
      break;
    case "host.presence":
      await handlePresence(connection, envelope);
      break;
    case "session.open":
      await openSession(connection, envelope);
      break;
    case "session.decision":
      await decideSession(connection, envelope);
      break;
    case "session.state":
      await handleClientSessionState(connection, envelope);
      break;
    case "session.cancel":
    case "session.close":
      await closeSession(connection, envelope);
      break;
    case "client.ping":
      sendEnvelope(connection, "client.pong", { server_time: unixNow() }, envelope.message_id);
      break;
    case "license.refresh":
      await refreshLicense(connection, envelope);
      break;
    default:
      closeSocket(connection.webSocket, 1008, "unknown_message_type");
  }
}

function parseEnvelope(data, connection) {
  if (data.byteLength > MAX_CONTROL_BYTES) {
    closeSocket(connection.webSocket, 1009, "message_too_large");
    return null;
  }

  let envelope;
  try {
    envelope = JSON.parse(data.toString("utf8"));
  } catch {
    closeSocket(connection.webSocket, 1007, "invalid_json");
    return null;
  }

  const now = unixNow();
  if (!envelope || envelope.version !== 1 || typeof envelope.type !== "string" ||
      typeof envelope.message_id !== "string" || envelope.message_id.length > 80 ||
      !Number.isSafeInteger(envelope.sequence) || envelope.sequence !== connection.inboundSequence + 1 ||
      !Number.isSafeInteger(envelope.issued_at) || !Number.isSafeInteger(envelope.expires_at) ||
      envelope.issued_at < now - 300 || envelope.issued_at > now + 30 ||
      envelope.expires_at <= now || envelope.expires_at > now + 300 ||
      !(envelope.reply_to === null || typeof envelope.reply_to === "string") ||
      !envelope.payload || typeof envelope.payload !== "object" || Array.isArray(envelope.payload) ||
      connection.messageIds.has(envelope.message_id)) {
    closeSocket(connection.webSocket, 1008, "invalid_or_replayed_envelope");
    return null;
  }

  connection.inboundSequence = envelope.sequence;
  connection.messageIds.add(envelope.message_id);
  if (connection.messageIds.size > 4096) {
    closeSocket(connection.webSocket, 1008, "message_window_exceeded");
    return null;
  }
  return envelope;
}

async function beginChallenge(connection, envelope) {
  if (!allowRate(`hello:${connection.remoteAddress}`, 12, 15 * 60_000)) {
    closeSocket(connection.webSocket, 1008, "rate_limited");
    return;
  }

  const payload = envelope.payload;
  if (payload.control_protocol_version !== 1 || !isInstallationId(payload.installation_id) ||
      typeof payload.app_version !== "string" || payload.app_version.length > 64 ||
      typeof payload.public_key !== "string" || payload.public_key.length > 2048 ||
      !isNonce(payload.client_nonce)) {
    closeSocket(connection.webSocket, 1008, "invalid_client_hello");
    return;
  }

  let publicKey;
  let publicKeyDer;
  try {
    publicKeyDer = Buffer.from(payload.public_key, "base64");
    publicKey = createPublicKey({ key: publicKeyDer, format: "der", type: "spki" });
  } catch {
    closeSocket(connection.webSocket, 1008, "invalid_public_key");
    return;
  }

  if (publicKey.asymmetricKeyType !== "ec" || publicKey.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
    closeSocket(connection.webSocket, 1008, "p256_key_required");
    return;
  }

  const challengeId = randomUUID();
  const serverNonce = randomBytes(32).toString("base64url");
  const issuedAt = unixNow();
  connection.pendingChallenge = {
    challengeId,
    installationId: payload.installation_id,
    clientNonce: payload.client_nonce,
    serverNonce,
    publicKey,
    publicKeySpki: publicKeyDer.toString("base64"),
    publicKeyFingerprint: createHash("sha256").update(publicKeyDer).digest("hex"),
    appVersion: payload.app_version,
    expiresAt: issuedAt + CHALLENGE_SECONDS,
  };

  sendEnvelope(connection, "client.challenge", {
    challenge_id: challengeId,
    server_nonce: serverNonce,
    server_origin: config.issuer,
    issued_at: issuedAt,
    expires_at: issuedAt + CHALLENGE_SECONDS,
  }, envelope.message_id, CHALLENGE_SECONDS);
}

async function completeChallenge(connection, envelope) {
  const challenge = connection.pendingChallenge;
  const payload = envelope.payload;
  if (!challenge || challenge.expiresAt <= unixNow() || payload.challenge_id !== challenge.challengeId ||
      payload.client_nonce !== challenge.clientNonce || payload.server_nonce !== challenge.serverNonce ||
      typeof payload.signature !== "string" || payload.signature.length > 512) {
    closeSocket(connection.webSocket, 1008, "challenge_expired_or_mismatched");
    return;
  }

  const proof = [
    "YS-DESK-CENTRAL-V1",
    config.issuer,
    challenge.challengeId,
    challenge.installationId,
    challenge.clientNonce,
    challenge.serverNonce,
    String(challenge.expiresAt - CHALLENGE_SECONDS),
    String(challenge.expiresAt),
  ].join("\n");
  const signature = Buffer.from(payload.signature, "base64");
  let signatureValid = false;
  try {
    signatureValid = signature.length === 64 && cryptoVerify(
      "sha256",
      Buffer.from(proof, "utf8"),
      { key: challenge.publicKey, dsaEncoding: "ieee-p1363" },
      signature,
    );
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) {
    closeSocket(connection.webSocket, 1008, "invalid_signature");
    return;
  }

  const device = await bindInstallation(challenge, payload.activation_code, connection.remoteAddress);
  if (!device) {
    closeSocket(connection.webSocket, 1008, "activation_or_license_required");
    return;
  }

  const license = await licenseForDevice(device);
  if (!license) {
    closeSocket(connection.webSocket, 1008, "license_expired_or_seats_exceeded");
    return;
  }

  connection.pendingChallenge = null;
  connection.device = device;
  connection.installationId = challenge.installationId;
  connection.publicKeyFingerprint = challenge.publicKeyFingerprint;
  connection.userId = device.userId;
  connection.token = randomBytes(32).toString("base64url");

  const previous = activeConnections.get(connection.installationId);
  if (previous && previous !== connection) closeSocket(previous.webSocket, 4001, "replaced_by_new_connection");
  activeConnections.set(connection.installationId, connection);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONTROL_TOKEN_SECONDS * 1000);
  await database.collection("centralTokens").insertOne({
    tokenHash: hash(connection.token),
    installationId: connection.installationId,
    deviceId: device._id,
    userId: device.userId,
    scopes: ["control", "license", "relay"],
    createdAt: now,
    expiresAt,
  });
  await database.collection("devices").updateOne(
    { _id: device._id, status: "active" },
    { $set: { lastSeenAt: now, presenceState: "offline", appVersion: challenge.appVersion } },
  );

  sendEnvelope(connection, "client.authenticated", {
    installation_id: connection.installationId,
    device_id: device._id.toHexString(),
    token_expires_at: expiresAt.toISOString(),
    heartbeat_seconds: 30,
    license: createSignedLicense(device, license, challenge.publicKeyFingerprint),
  }, envelope.message_id, CONTROL_TOKEN_SECONDS);
}

async function bindInstallation(challenge, rawActivationCode, remoteAddress) {
  const devices = database.collection("devices");
  let device = await devices.findOne({ installationId: challenge.installationId });

  if (device) {
    if (device.status !== "active" || device.publicKeyFingerprint !== challenge.publicKeyFingerprint) return null;
    return device;
  }

  if (typeof rawActivationCode !== "string" || rawActivationCode.length < 32 || rawActivationCode.length > 128 ||
      !allowRate(`activation:${remoteAddress}`, 8, 15 * 60_000)) return null;

  const activationCodeHash = hash(rawActivationCode);
  device = await devices.findOne({
    status: "active",
    $or: [
      { activationCodeHash },
      { activationCode: rawActivationCode },
    ],
  });
  if (!device || (device.activationExpiresAt && device.activationExpiresAt <= new Date())) return null;
  if (device.installationId || (device.publicKeyFingerprint && device.publicKeyFingerprint !== challenge.publicKeyFingerprint)) return null;

  const updated = await devices.updateOne(
    { _id: device._id, status: "active", installationId: { $exists: false } },
    {
      $set: {
        installationId: challenge.installationId,
        publicKeySpki: challenge.publicKeySpki,
        publicKeyFingerprint: challenge.publicKeyFingerprint,
        activatedAt: new Date(),
      },
      $unset: { activationCode: "", activationCodeHash: "", activationExpiresAt: "" },
    },
  );
  if (!updated.modifiedCount) return null;

  return devices.findOne({ _id: device._id });
}

async function licenseForDevice(device) {
  const now = new Date();
  const [licenses, devices] = await Promise.all([
    database.collection("licenses").find({ userId: device.userId, expiresAt: { $gt: now } }).sort({ expiresAt: 1, purchasedAt: 1 }).toArray(),
    database.collection("devices").find({ userId: device.userId, status: "active" }).sort({ createdAt: 1, _id: 1 }).toArray(),
  ]);
  const deviceIndex = devices.findIndex((entry) => entry._id.equals(device._id));
  if (deviceIndex < 0) return null;

  let seatIndex = deviceIndex;
  for (const license of licenses) {
    if (seatIndex < license.machineCount) return license;
    seatIndex -= license.machineCount;
  }
  return null;
}

function createSignedLicense(device, license, fingerprint) {
  const issuedAt = new Date();
  const payload = {
    schema_version: 1,
    license_id: license._id.toHexString(),
    issuer: config.issuer,
    installation_id: device.installationId,
    public_key_fingerprint: fingerprint,
    issued_at: issuedAt.toISOString(),
    not_before: issuedAt.toISOString(),
    expires_at: license.expiresAt.toISOString(),
    features: ["central_access", "relay", "view_screen", "control_input", "send_file", "receive_file"],
    limits: { simultaneous_sessions: 1 },
    policy_version: "1",
    offline_grace_seconds: 86_400,
  };
  const canonicalPayload = canonicalJson(payload);
  const signature = cryptoSign(null, Buffer.from(canonicalPayload, "utf8"), config.licensePrivateKey).toString("base64url");
  return { algorithm: "Ed25519", key_id: config.licenseKeyId, payload, signature };
}

async function authenticateEnvelope(connection, envelope) {
  if (typeof envelope.access_token !== "string" || envelope.access_token.length < 32) return null;
  const tokenRecord = await database.collection("centralTokens").findOne({
    tokenHash: hash(envelope.access_token),
    installationId: connection.installationId,
    deviceId: connection.device._id,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!tokenRecord) return null;

  const device = await database.collection("devices").findOne({
    _id: connection.device._id,
    status: "active",
    installationId: connection.installationId,
    publicKeyFingerprint: connection.publicKeyFingerprint,
  });
  if (!device || !(await licenseForDevice(device))) return null;
  connection.device = device;
  connection.tokenRecord = tokenRecord;
  return tokenRecord;
}

async function handleHeartbeat(connection, envelope, tokenRecord) {
  if (envelope.payload.installation_id !== connection.installationId ||
  envelope.payload.sequence !== envelope.sequence ||
  !Array.isArray(envelope.payload.active_session_ids) || envelope.payload.active_session_ids.length > 4 ||
  envelope.payload.active_session_ids.some((sessionId) => !isInstallationId(sessionId))) {
    closeSocket(connection.webSocket, 1008, "invalid_heartbeat");
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONTROL_TOKEN_SECONDS * 1000);
  await database.collection("centralTokens").updateOne(
    { _id: tokenRecord._id },
    { $set: { expiresAt } },
  );
  await database.collection("devices").updateOne(
    { _id: connection.device._id, status: "active" },
    { $set: { lastSeenAt: now } },
  );

  const license = await licenseForDevice(connection.device);
  if (!license) {
    closeSocket(connection.webSocket, 1008, "license_expired");
    return;
  }
  sendEnvelope(connection, "client.heartbeat.ack", {
    server_time: unixNow(),
    token_expires_at: expiresAt.toISOString(),
    license: createSignedLicense(connection.device, license, connection.publicKeyFingerprint),
  }, envelope.message_id, CONTROL_TOKEN_SECONDS);
}

async function handlePresence(connection, envelope) {
  const state = envelope.payload.state;
  const capabilities = envelope.payload.capabilities;
  if (!new Set(["ready", "busy", "offline"]).has(state) || !Array.isArray(capabilities) ||
      capabilities.length > ALLOWED_CAPABILITIES.size || capabilities.some((entry) => !ALLOWED_CAPABILITIES.has(entry))) {
    closeSocket(connection.webSocket, 1008, "invalid_presence");
    return;
  }

  await database.collection("devices").updateOne(
    { _id: connection.device._id, status: "active" },
    { $set: { presenceState: state, lastSeenAt: new Date(), capabilities } },
  );
  connection.device.presenceState = state;
  connection.device.capabilities = capabilities;
  sendEnvelope(connection, "host.presence.ack", { state }, envelope.message_id);
}

async function refreshLicense(connection, envelope) {
  const license = await licenseForDevice(connection.device);
  if (!license) {
    closeSocket(connection.webSocket, 1008, "license_expired");
    return;
  }
  sendEnvelope(connection, "license.update", {
    license: createSignedLicense(connection.device, license, connection.publicKeyFingerprint),
  }, envelope.message_id);
}

function sendEnvelope(connection, type, payload, replyTo = null, expiresInSeconds = 60) {
  if (connection.webSocket.readyState !== WebSocket.OPEN) return;
  const issuedAt = unixNow();
  const envelope = {
    version: 1,
    message_id: randomUUID(),
    type,
    sequence: ++connection.outboundSequence,
    issued_at: issuedAt,
    expires_at: issuedAt + expiresInSeconds,
    reply_to: replyTo,
    payload,
    ...(connection.token ? { access_token: connection.token } : {}),
  };
  connection.webSocket.send(JSON.stringify(envelope));
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    return config.allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function isInstallationId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isNonce(value) {
  if (typeof value !== "string" || value.length > 128) return false;
  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length === 32 && decoded.toString("base64url") === value;
  } catch { return false; }
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hashRelayTicket(value) {
  return createHmac("sha256", config.relaySecret).update(value).digest("hex");
}

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function allowRate(key, limit, windowMs) {
  const now = Date.now();
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function clientAddress(request) {
  if (config.trustProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim().slice(0, 64);
  }
  return request.socket.remoteAddress || "unknown";
}

function rejectUpgrade(socket, status, reason) {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function closeSocket(webSocket, code, reason) {
  if (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING) {
    webSocket.close(code, reason.slice(0, 100));
  }
}

async function handleControlClose(connection) {
  if (connection.closed) return;
  connection.closed = true;
  if (connection.installationId && activeConnections.get(connection.installationId) === connection) {
    activeConnections.delete(connection.installationId);
    await database.collection("devices").updateOne(
      { _id: connection.device._id, installationId: connection.installationId },
      { $set: { presenceState: "offline", lastSeenAt: new Date() } },
    );
  }
}

async function openSession(connection, envelope) {
  if (!allowRate(`session:${connection.installationId}`, 10, 60_000)) {
    sendEnvelope(connection, "session.error", { code: "rate_limited" }, envelope.message_id);
    return;
  }

  const { target_installation_id: targetId, requested_capabilities: requested } = envelope.payload;
  if (!isInstallationId(targetId) || targetId === connection.installationId || !Array.isArray(requested) ||
      requested.length < 1 || requested.length > ALLOWED_CAPABILITIES.size ||
      new Set(requested).size !== requested.length || requested.some((capability) => !ALLOWED_CAPABILITIES.has(capability)) ||
      !isNonce(envelope.payload.viewer_nonce)) {
    sendEnvelope(connection, "session.error", { code: "invalid_request" }, envelope.message_id);
    return;
  }

  const host = activeConnections.get(targetId);
  if (!host || host.webSocket.readyState !== WebSocket.OPEN || host.device.presenceState !== "ready") {
    sendEnvelope(connection, "session.error", { code: "host_unavailable" }, envelope.message_id);
    return;
  }
  if (requested.some((capability) => !host.device.capabilities?.includes(capability))) {
    sendEnvelope(connection, "session.error", { code: "capability_unavailable" }, envelope.message_id);
    return;
  }
  if (!(await licenseForDevice(host.device)) || !(await licenseForDevice(connection.device))) {
    sendEnvelope(connection, "session.error", { code: "license_required" }, envelope.message_id);
    return;
  }

  const existingSession = await database.collection("centralSessions").findOne({
    state: { $in: ["pending", "accepted", "connected"] },
    $or: [
      { hostInstallationId: connection.installationId },
      { viewerInstallationId: connection.installationId },
      { hostInstallationId: targetId },
      { viewerInstallationId: targetId },
    ],
  });
  if (existingSession) {
    sendEnvelope(connection, "session.error", { code: "session_limit_reached" }, envelope.message_id);
    return;
  }

  const sessionId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60_000);
  const requesterName = connection.device.name.slice(0, 48);
  const session = {
    sessionId,
    hostInstallationId: targetId,
    viewerInstallationId: connection.installationId,
    hostDeviceId: host.device._id,
    viewerDeviceId: connection.device._id,
    viewerNonce: envelope.payload.viewer_nonce,
    requestedCapabilities: requested,
    state: "pending",
    createdAt: now,
    expiresAt,
  };
  await database.collection("centralSessions").insertOne(session);
  try {
    await database.collection("centralSessionLocks").insertMany([
      { installationId: targetId, sessionId, expiresAt },
      { installationId: connection.installationId, sessionId, expiresAt },
    ]);
  } catch (error) {
    await database.collection("centralSessionLocks").deleteMany({ sessionId });
    await database.collection("centralSessions").updateOne(
      { sessionId },
      { $set: { state: "rejected", closedAt: new Date(), expiresAt: retentionExpiry() } },
    );
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      sendEnvelope(connection, "session.error", { code: "session_limit_reached" }, envelope.message_id);
      return;
    }
    throw error;
  }

  sendEnvelope(host, "session.request", {
    session_id: sessionId,
    requester_installation_id: connection.installationId,
    requester_name: requesterName,
    viewer_nonce: envelope.payload.viewer_nonce,
    requested_capabilities: requested,
    expires_at: expiresAt.toISOString(),
  }, envelope.message_id);
  sendEnvelope(connection, "session.opened", { session_id: sessionId, state: "pending", expires_at: expiresAt.toISOString() }, envelope.message_id);
}

async function decideSession(connection, envelope) {
  const sessionId = envelope.payload.session_id;
  const accepted = envelope.payload.decision === "accepted";
  if (typeof sessionId !== "string" || !isInstallationId(sessionId) || typeof envelope.payload.decision !== "string" ||
      !["accepted", "rejected"].includes(envelope.payload.decision)) {
    sendEnvelope(connection, "session.error", { code: "invalid_decision" }, envelope.message_id);
    return;
  }

  const sessions = database.collection("centralSessions");
  const session = await sessions.findOne({ sessionId, hostInstallationId: connection.installationId, state: "pending", expiresAt: { $gt: new Date() } });
  if (!session) {
    sendEnvelope(connection, "session.error", { code: "request_expired" }, envelope.message_id);
    return;
  }

  const viewer = activeConnections.get(session.viewerInstallationId);
  if (!viewer || viewer.webSocket.readyState !== WebSocket.OPEN) {
    await sessions.updateOne({ _id: session._id }, { $set: { state: "expired", expiresAt: retentionExpiry() } });
    await database.collection("centralSessionLocks").deleteMany({ sessionId });
    sendEnvelope(connection, "session.state", { session_id: sessionId, state: "expired", reason_code: "viewer_disconnected" }, envelope.message_id);
    return;
  }

  if (!accepted) {
    await sessions.updateOne({ _id: session._id }, { $set: { state: "rejected", closedAt: new Date(), expiresAt: retentionExpiry() } });
    await database.collection("centralSessionLocks").deleteMany({ sessionId });
    sendEnvelope(viewer, "session.state", { session_id: sessionId, state: "rejected", reason_code: "host_rejected" }, envelope.message_id);
    sendEnvelope(connection, "session.state", { session_id: sessionId, state: "rejected" }, envelope.message_id);
    return;
  }

  if (!(await licenseForDevice(connection.device)) || !(await licenseForDevice(viewer.device))) {
    await sessions.updateOne({ _id: session._id }, { $set: { state: "rejected", closedAt: new Date(), expiresAt: retentionExpiry() } });
    await database.collection("centralSessionLocks").deleteMany({ sessionId });
    sendEnvelope(viewer, "session.state", { session_id: sessionId, state: "rejected", reason_code: "license_expired" }, envelope.message_id);
    return;
  }

  const ticketExpiresAt = new Date(Date.now() + 60_000);
  const hostTicket = randomBytes(32).toString("base64url");
  const viewerTicket = randomBytes(32).toString("base64url");
  const ticketCollection = database.collection("relayTickets");
  await ticketCollection.insertMany([
    { tokenHash: hashRelayTicket(hostTicket), sessionId, installationId: session.hostInstallationId, role: "host", expiresAt: ticketExpiresAt },
    { tokenHash: hashRelayTicket(viewerTicket), sessionId, installationId: session.viewerInstallationId, role: "viewer", expiresAt: ticketExpiresAt },
  ]);
  await sessions.updateOne({ _id: session._id }, { $set: { state: "accepted", expiresAt: ticketExpiresAt } });
  await database.collection("centralSessionLocks").updateMany({ sessionId }, { $set: { expiresAt: ticketExpiresAt } });

  sendEnvelope(connection, "session.connect", {
    session_id: sessionId,
    role: "host",
    relay_endpoint: config.relayEndpoint,
    ticket: hostTicket,
    ticket_expires_at: ticketExpiresAt.toISOString(),
    capabilities: session.requestedCapabilities,
    session_protocol_version: 2,
  }, envelope.message_id);
  sendEnvelope(viewer, "session.connect", {
    session_id: sessionId,
    role: "viewer",
    relay_endpoint: config.relayEndpoint,
    ticket: viewerTicket,
    ticket_expires_at: ticketExpiresAt.toISOString(),
    capabilities: session.requestedCapabilities,
    session_protocol_version: 2,
  }, envelope.message_id);
}

async function closeSession(connection, envelope) {
  const sessionId = envelope.payload.session_id;
  if (typeof sessionId !== "string") {
    sendEnvelope(connection, "session.error", { code: "invalid_session" }, envelope.message_id);
    return;
  }

  const session = await database.collection("centralSessions").findOne({
    sessionId,
    $or: [
      { hostInstallationId: connection.installationId },
      { viewerInstallationId: connection.installationId },
    ],
    state: { $in: ["pending", "accepted", "connected"] },
  });
  if (!session) {
    sendEnvelope(connection, "session.error", { code: "session_not_found" }, envelope.message_id);
    return;
  }

  await database.collection("centralSessions").updateOne(
    { _id: session._id },
    { $set: { state: "closed", closedAt: new Date(), expiresAt: retentionExpiry() } },
  );
  await database.collection("relayTickets").deleteMany({ sessionId });
  await database.collection("centralSessionLocks").deleteMany({ sessionId });
  closeRelayPair(sessionId, "session_closed");

  const otherId = session.hostInstallationId === connection.installationId ? session.viewerInstallationId : session.hostInstallationId;
  const other = activeConnections.get(otherId);
  const payload = { session_id: sessionId, state: "closed", reason_code: safeReason(envelope.payload.reason_code) };
  sendEnvelope(connection, "session.state", payload, envelope.message_id);
  if (other) sendEnvelope(other, "session.state", payload, envelope.message_id);
}

async function handleClientSessionState(connection, envelope) {
  const { session_id: sessionId, state, reason_code: reasonCode } = envelope.payload;
  if (typeof sessionId !== "string" || !isInstallationId(sessionId) ||
      !["connecting", "connected", "failed", "closed", "ended"].includes(state)) {
    sendEnvelope(connection, "session.error", { code: "invalid_session_state" }, envelope.message_id);
    return;
  }

  const session = await database.collection("centralSessions").findOne({
    sessionId,
    $or: [
      { hostInstallationId: connection.installationId },
      { viewerInstallationId: connection.installationId },
    ],
    state: { $in: ["accepted", "connected"] },
  });
  if (!session) {
    sendEnvelope(connection, "session.error", { code: "session_not_found" }, envelope.message_id);
    return;
  }

  if (state === "connecting") {
    sendEnvelope(connection, "session.state.ack", { session_id: sessionId, state }, envelope.message_id);
    return;
  }
  if (state === "connected") {
    if (session.state !== "connected") {
      sendEnvelope(connection, "session.error", { code: "relay_not_connected" }, envelope.message_id);
      return;
    }
    sendEnvelope(connection, "session.state.ack", { session_id: sessionId, state }, envelope.message_id);
    return;
  }

  const finalState = state === "failed" ? "rejected" : "closed";
  const reportedState = state === "ended" ? "closed" : state;
  await database.collection("centralSessions").updateOne(
    { _id: session._id, state: session.state },
    { $set: { state: finalState, closedAt: new Date(), expiresAt: retentionExpiry() } },
  );
  await database.collection("relayTickets").deleteMany({ sessionId });
  await database.collection("centralSessionLocks").deleteMany({ sessionId });
  closeRelayPair(sessionId, safeReason(reasonCode || (state === "failed" ? "client_failed" : "client_closed")));

  const otherId = session.hostInstallationId === connection.installationId ? session.viewerInstallationId : session.hostInstallationId;
  const other = activeConnections.get(otherId);
  const payload = { session_id: sessionId, state: reportedState, reason_code: safeReason(reasonCode || (state === "failed" ? "client_failed" : "client_closed")) };
  sendEnvelope(connection, "session.state.ack", payload, envelope.message_id);
  if (other) sendEnvelope(other, "session.state", payload, envelope.message_id);
}

async function expirePendingSessions() {
  const now = new Date();
  const expired = await database.collection("centralSessions").find({ state: { $in: ["pending", "accepted"] }, expiresAt: { $lte: now } }).limit(100).toArray();
  if (!expired.length) return;

  await database.collection("centralSessions").updateMany(
    { _id: { $in: expired.map((session) => session._id) }, state: { $in: ["pending", "accepted"] } },
    { $set: { state: "expired", expiresAt: retentionExpiry() } },
  );
  for (const session of expired) {
    await database.collection("centralSessionLocks").deleteMany({ sessionId: session.sessionId });
    await database.collection("relayTickets").deleteMany({ sessionId: session.sessionId });
    closeRelayPair(session.sessionId, "session_expired");
    const viewer = activeConnections.get(session.viewerInstallationId);
    const host = activeConnections.get(session.hostInstallationId);
    const payload = { session_id: session.sessionId, state: "expired", reason_code: "consent_timeout" };
    if (viewer) sendEnvelope(viewer, "session.state", payload);
    if (host) sendEnvelope(host, "session.state", payload);
  }
}

function retentionExpiry() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function safeReason(value) {
  return typeof value === "string" && /^[a-z0-9_]{1,48}$/.test(value) ? value : "user_closed";
}

async function handleRelayConnection(webSocket, request) {
  const authorization = request.headers.authorization;
  const ticket = typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (ticket.length < 32 || ticket.length > 128) {
    closeSocket(webSocket, 1008, "ticket_required");
    return;
  }

  const ticketHash = hashRelayTicket(ticket);
  const tickets = database.collection("relayTickets");
  const ticketRecord = await tickets.findOne({ tokenHash: ticketHash, expiresAt: { $gt: new Date() }, usedAt: { $exists: false } });
  if (!ticketRecord) {
    closeSocket(webSocket, 1008, "ticket_invalid_or_used");
    return;
  }
  const consumed = await tickets.updateOne(
    { _id: ticketRecord._id, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );
  if (!consumed.modifiedCount) {
    closeSocket(webSocket, 1008, "ticket_invalid_or_used");
    return;
  }

  const session = await database.collection("centralSessions").findOne({
    sessionId: ticketRecord.sessionId,
    state: "accepted",
    expiresAt: { $gt: new Date() },
  });
  if (!session || (ticketRecord.role === "host" && ticketRecord.installationId !== session.hostInstallationId) ||
      (ticketRecord.role === "viewer" && ticketRecord.installationId !== session.viewerInstallationId)) {
    closeSocket(webSocket, 1008, "session_not_available");
    return;
  }
  const device = await database.collection("devices").findOne({ installationId: ticketRecord.installationId, status: "active" });
  if (!device || !(await licenseForDevice(device))) {
    closeSocket(webSocket, 1008, "license_or_installation_revoked");
    return;
  }

  let pair = pendingRelays.get(session.sessionId);
  if (!pair) {
    pair = { session, host: null, viewer: null, connected: false, timer: null };
    pendingRelays.set(session.sessionId, pair);
    pair.timer = setTimeout(() => closeRelayPair(session.sessionId, "peer_timeout"), 60_000);
    pair.timer.unref();
  }

  if (pair[ticketRecord.role]) {
    closeSocket(webSocket, 1008, "duplicate_role");
    return;
  }
  pair[ticketRecord.role] = { webSocket, installationId: ticketRecord.installationId };

  webSocket.on("message", (data, isBinary) => {
    if (!isBinary) {
      closeRelayPair(session.sessionId, "binary_stream_required");
      return;
    }
    const target = ticketRecord.role === "host" ? pair.viewer?.webSocket : pair.host?.webSocket;
    if (!target || target.readyState !== WebSocket.OPEN) return;
    if (target.bufferedAmount > 32 * 1024 * 1024) {
      closeRelayPair(session.sessionId, "relay_backpressure");
      return;
    }
    target.send(data, { binary: true });
  });

  webSocket.on("close", () => closeRelayPair(session.sessionId, "peer_disconnected"));
  webSocket.on("error", () => closeRelayPair(session.sessionId, "peer_error"));

  if (pair.host && pair.viewer) await connectRelayPair(pair);
}

async function connectRelayPair(pair) {
  if (pair.connected) return;
  const [host, viewer] = await Promise.all([
    database.collection("devices").findOne({ installationId: pair.session.hostInstallationId, status: "active" }),
    database.collection("devices").findOne({ installationId: pair.session.viewerInstallationId, status: "active" }),
  ]);
  if (!host || !viewer || !(await licenseForDevice(host)) || !(await licenseForDevice(viewer))) {
    const now = new Date();
    await database.collection("centralSessions").updateOne(
      { sessionId: pair.session.sessionId, state: "accepted" },
      { $set: { state: "rejected", closedAt: now, expiresAt: retentionExpiry() } },
    );
    await database.collection("centralSessionLocks").deleteMany({ sessionId: pair.session.sessionId });
    await database.collection("relayTickets").deleteMany({ sessionId: pair.session.sessionId });
    for (const installationId of [pair.session.hostInstallationId, pair.session.viewerInstallationId]) {
      const connection = activeConnections.get(installationId);
      if (connection) sendEnvelope(connection, "session.state", { session_id: pair.session.sessionId, state: "rejected", reason_code: "authorization_revoked" });
    }
    closeRelayPair(pair.session.sessionId, "authorization_revoked");
    return;
  }

  pair.connected = true;
  clearTimeout(pair.timer);
  const now = new Date();
  await database.collection("centralSessions").updateOne(
    { sessionId: pair.session.sessionId, state: "accepted" },
    { $set: { state: "connected", connectedAt: now, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
  );
  await database.collection("centralSessionLocks").updateMany(
    { sessionId: pair.session.sessionId },
    { $set: { expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
  );
  pair.monitorTimer = setInterval(() => {
    void validateRelayPair(pair).catch(() => closeRelayPair(pair.session.sessionId, "authorization_check_failed"));
  }, 15_000);
  pair.monitorTimer.unref();
  for (const installationId of [pair.session.hostInstallationId, pair.session.viewerInstallationId]) {
    const connection = activeConnections.get(installationId);
    if (connection) sendEnvelope(connection, "session.state", { session_id: pair.session.sessionId, state: "connected" });
  }
}

async function validateRelayPair(pair) {
  const [session, host, viewer] = await Promise.all([
    database.collection("centralSessions").findOne({ sessionId: pair.session.sessionId, state: "connected", expiresAt: { $gt: new Date() } }),
    database.collection("devices").findOne({ installationId: pair.session.hostInstallationId, status: "active" }),
    database.collection("devices").findOne({ installationId: pair.session.viewerInstallationId, status: "active" }),
  ]);
  if (!session || !host || !viewer || !(await licenseForDevice(host)) || !(await licenseForDevice(viewer))) {
    closeRelayPair(pair.session.sessionId, "authorization_revoked");
  }
}

function closeRelayPair(sessionId, reason) {
  const pair = pendingRelays.get(sessionId);
  if (!pair) return;
  pendingRelays.delete(sessionId);
  clearTimeout(pair.timer);
  clearInterval(pair.monitorTimer);
  for (const participant of [pair.host, pair.viewer]) {
    if (participant?.webSocket.readyState === WebSocket.OPEN) {
      participant.webSocket.close(1000, reason.slice(0, 100));
    }
  }
  if (pair.connected) {
    void database.collection("centralSessionLocks").deleteMany({ sessionId }).catch(() => undefined);
    void database.collection("centralSessions").updateOne(
      { sessionId, state: "connected" },
      { $set: { state: "closed", closedAt: new Date(), expiresAt: retentionExpiry() } },
    ).catch(() => undefined);
    for (const installationId of [pair.session.hostInstallationId, pair.session.viewerInstallationId]) {
      const connection = activeConnections.get(installationId);
      if (connection) sendEnvelope(connection, "session.state", { session_id: sessionId, state: "closed", reason_code: safeReason(reason) });
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  clearInterval(expiryTimer);
  clearInterval(rateLimitTimer);
  for (const connection of activeConnections.values()) closeSocket(connection.webSocket, 1001, "server_shutdown");
  for (const sessionId of pendingRelays.keys()) closeRelayPair(sessionId, "server_shutdown");
  server.close();
  await mongoClient.close();
  process.exit(0);
}