import { Hono } from "hono";
import {
  LIST,
  CREATE,
  FULFIL,
  DELETED,
  STATS,
  RDM,
} from "./db/queries";

const app = new Hono();

app.get("/", (c) =>
  c.html(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Winter Wishes</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: linear-gradient(to bottom, #0b1120, #1e293b); color: #e5e7eb; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .card { background: rgba(15, 23, 42, 0.95); border-radius: 16px; padding: 32px 28px; max-width: 420px; width: 100%; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.35); }
      .title { font-size: 28px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #e5e7eb; margin-bottom: 4px; }
      .subtitle { font-size: 14px; color: #9ca3af; margin-bottom: 20px; }
      .badge-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
      .badge { font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.5); color: #d1d5db; text-transform: uppercase; letter-spacing: 0.08em; }
      .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: #9ca3af; margin-bottom: 6px; }
      .row { display: flex; gap: 8px; margin-bottom: 16px; }
      input { flex: 1; padding: 10px 12px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.7); background: rgba(15, 23, 42, 0.9); color: #e5e7eb; font-size: 14px; outline: none; }
      input::placeholder { color: #6b7280; }
      button { padding: 10px 16px; border-radius: 999px; border: none; background: linear-gradient(to right, #f97316, #ea580c); color: #0b1120; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; }
      button:disabled { opacity: 0.5; cursor: default; }
      .list { margin-top: 8px; max-height: 220px; overflow-y: auto; padding-right: 6px; }
      .wish { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(31, 41, 55, 0.8); font-size: 14px; }
      .wish:last-child { border-bottom: none; }
      .wish-main { display: flex; flex-direction: column; gap: 2px; }
      .wish-item { color: #e5e7eb; }
      .wish-meta { font-size: 11px; color: #9ca3af; }
      .wish-actions { display: flex; gap: 6px; }
      .pill { padding: 4px 8px; border-radius: 999px; font-size: 11px; }
      .pill-blue { background: rgba(59, 130, 246, 0.16); color: #bfdbfe; }
      .pill-gray { background: rgba(55, 65, 81, 0.9); color: #e5e7eb; }
      .pill-green { background: rgba(22, 163, 74, 0.15); color: #bbf7d0; }
      .pill-outline { border: 1px solid rgba(148, 163, 184, 0.7); background: transparent; color: #e5e7eb; }
      .empty { font-size: 13px; color: #9ca3af; margin-top: 8px; }
      .status { font-size: 12px; color: #a5b4fc; margin-top: 8px; min-height: 18px; }
      .footer { margin-top: 20px; font-size: 11px; color: #6b7280; }
      .dot-row { display: flex; gap: 4px; margin-top: 8px; }
      .dot { width: 4px; height: 4px; border-radius: 999px; background: rgba(148, 163, 184, 0.55); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">Winter Wishes</div>
      <div class="subtitle">An API for tracking winter wishes and sending them into the cold night air.</div>
      <div class="badge-row">
        <div class="badge">Hono</div>
        <div class="badge">SQLite</div>
        <div class="badge">Drizzle</div>
      </div>
      <div class="label">Add a wish</div>
      <div class="row">
        <input id="wish-input" placeholder="Write a winter wish" />
        <button id="wish-button">Send</button>
      </div>
      <div class="label">Current wishes</div>
      <div id="wish-list" class="list"></div>
      <div id="empty" class="empty">No wishes yet. The winter sky is clear.</div>
      <div id="status" class="status"></div>
      <div id="stats" class="status"></div>
      <div class="footer">
        API routes:
        GET /api/wishes,
        POST /api/wishes,
        PATCH /api/wishes/:id/fulfill,
        DELETE /api/wishes/:id
        <div class="dot-row">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>
    <script>
      const input = document.getElementById("wish-input");
      const button = document.getElementById("wish-button");
      const list = document.getElementById("wish-list");
      const empty = document.getElementById("empty");
      const status = document.getElementById("status");
      const statsEl = document.getElementById("stats");

      async function loadWishes() {
        try {
          const res = await fetch("/api/wishes");
          const data = await res.json();
          render(data);
          await loadStats();
        } catch (e) {
          status.textContent = "Could not load wishes. Check that the server is running.";
        }
      }

      async function loadStats() {
        try {
          const res = await fetch("/api/wishes/stats");
          const data = await res.json();
          statsEl.textContent =
            "Total: " +
            data.total +
            " • Fulfilled: " +
            data.fulfilled +
            " • Pending: " +
            data.pending +
            " • Avg importance: " +
            data.averageImportance;
        } catch (e) {
          statsEl.textContent = "";
        }
      }

      function render(items) {
        list.innerHTML = "";
        if (!items.length) {
          empty.style.display = "block";
          return;
        }
        empty.style.display = "none";
        for (const wish of items) {
          const row = document.createElement("div");
          row.className = "wish";
          const main = document.createElement("div");
          main.className = "wish-main";
          const item = document.createElement("div");
          item.className = "wish-item";
          item.textContent = wish.item;
          const meta = document.createElement("div");
          meta.className = "wish-meta";
          const created = new Date((wish.createdAt || 0) * 1000);
          const time = isNaN(created.getTime()) ? "" : created.toLocaleString();
          const label = wish.fulfilled ? "fulfilled" : "waiting in the cold air";
          const category = wish.category || "winter";
          const mood = wish.mood || "cozy";
          const temp =
            typeof wish.temperature === "number"
              ? wish.temperature + "°C"
              : "-5°C";
          const importance =
            typeof wish.importance === "number" ? wish.importance : 1;
          meta.textContent =
            category +
            " • " +
            mood +
            " • " +
            temp +
            " • importance " +
            importance +
            " • " +
            label +
            (time ? " • " + time : "");
          main.appendChild(item);
          main.appendChild(meta);
          const actions = document.createElement("div");
          actions.className = "wish-actions";
          if (!wish.fulfilled) {
            const fulfill = document.createElement("button");
            fulfill.className = "pill pill-green";
            fulfill.textContent = "Mark fulfilled";
            fulfill.onclick = async () => {
              fulfill.disabled = true;
              await fetch("/api/wishes/" + wish.id + "/fulfill", { method: "PATCH" });
              await loadWishes();
            };
            actions.appendChild(fulfill);
          } else {
            const badge = document.createElement("div");
            badge.className = "pill pill-blue";
            badge.textContent = "Fulfilled";
            actions.appendChild(badge);
          }
          const remove = document.createElement("button");
          remove.className = "pill pill-outline";
          remove.textContent = "Remove";
          remove.onclick = async () => {
            remove.disabled = true;
            await fetch("/api/wishes/" + wish.id, { method: "DELETE" });
            await loadWishes();
          };
          actions.appendChild(remove);
          row.appendChild(main);
          row.appendChild(actions);
          list.appendChild(row);
        }
      }

      async function create() {
        const value = (input.value || "").trim();
        if (!value) return;
        button.disabled = true;
        status.textContent = "";
        try {
          await fetch("/api/wishes", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ item: value }),
          });
          input.value = "";
          await loadWishes();
          status.textContent = "Wish stored in the winter log.";
        } catch (e) {
          status.textContent = "Could not create wish. Check the server logs.";
        } finally {
          button.disabled = false;
        }
      }

      button.addEventListener("click", () => create());
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") create();
      });

      loadWishes();
    </script>
  </body>
</html>`
  )
);

app.get("/api/wishes", (c) => c.json(listWishes()));

app.post("/api/wishes", async (c) => {
  const body = await c.req.json().catch(() => null);
  const item = (body?.item ?? "").toString().trim();
  if (!item) return c.json({ error: "item is required" }, 400);
  return c.json(createWish(item), 201);
});

app.get("/api/wishes/stats", (c) => c.json(wishStats()));

app.get("/api/wishes/random", (c) => {
  const wish = randomPendingWish();
  if (!wish) return c.json({ error: "no pending wishes" }, 404);
  return c.json(wish);
});

app.patch("/api/wishes/:id/fulfill", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);
  const res = fulfillWish(id);
  if (res.changes === 0) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

app.delete("/api/wishes/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);
  const res = deleteWish(id);
  if (res.changes === 0) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000

export default {
  port,
  fetch: app.fetch,
}
