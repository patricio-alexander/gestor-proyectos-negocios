import "dotenv/config";
import { createServer, type IncomingMessage } from "http";
import { Server, type Socket } from "socket.io";
import { jwtVerify } from "jose";

const REALTIME_PORT = Number(process.env.REALTIME_PORT ?? 3003);
const INTERNAL_SECRET = process.env.REALTIME_INTERNAL_SECRET ?? "";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret-jwt-key-gestor-proyectos",
);
const CORS_ORIGIN = process.env.REALTIME_CORS_ORIGIN ?? "http://localhost:3002";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function verifyDashboardToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

const httpServer = createServer(async (req, res) => {
  if (!req.url?.startsWith("/internal/emit") || req.method !== "POST") {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const auth = req.headers.authorization ?? "";
  if (!INTERNAL_SECRET || auth !== `Bearer ${INTERNAL_SECRET}`) {
    res.statusCode = 401;
    res.end("Unauthorized");
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw) as {
      event?: string;
      room?: string;
      data?: unknown;
    };

    const event = body.event ?? "dashboard:refresh";
    const room = body.room ?? "dashboard";

    io.to(room).emit(event, body.data ?? {});

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, event, room }));
  } catch (err) {
    console.error("[realtime] internal emit error:", err);
    res.statusCode = 400;
    res.end("Bad request");
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  },
  path: "/socket.io",
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !(await verifyDashboardToken(token))) {
    next(new Error("Unauthorized"));
    return;
  }
  next();
});

io.on("connection", (socket: Socket) => {
  socket.join("dashboard");
  console.log("[realtime] dashboard conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("[realtime] desconectado:", socket.id);
  });
});

httpServer.listen(REALTIME_PORT, () => {
  console.log(`[realtime] Socket.IO en puerto ${REALTIME_PORT}`);
  if (!INTERNAL_SECRET) {
    console.warn("[realtime] REALTIME_INTERNAL_SECRET no definido — emit interno deshabilitado");
  }
});
