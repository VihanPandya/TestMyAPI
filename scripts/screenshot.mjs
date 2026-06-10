/**
 * Captures the screenshots used in the README.
 *
 * Requires the app to be running (see usage below) and a Chromium that
 * Playwright can drive. On Claude Code's web environment Chromium is
 * pre-installed under $PLAYWRIGHT_BROWSERS_PATH; locally, run
 * `npx playwright install chromium` first.
 *
 * Usage:
 *   ALLOW_PRIVATE_HOSTS=true PORT=3020 npm start &   # app must allow the local echo
 *   node scripts/screenshot.mjs
 *
 * Env:
 *   BASE_URL   app origin            (default http://127.0.0.1:3020)
 *   ECHO_PORT  local mock API port   (default 4546)
 *   OUT_DIR    output directory      (default docs/screenshots)
 *   PLAYWRIGHT_CHROMIUM_PATH  explicit Chromium binary (optional)
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3020";
const ECHO_PORT = Number(process.env.ECHO_PORT ?? 4546);
const OUT_DIR = process.env.OUT_DIR ?? "docs/screenshots";

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && existsSync(base)) {
    const build = readdirSync(base)
      .filter((d) => d.startsWith("chromium-") && !d.includes("headless"))
      .sort()
      .pop();
    if (build) {
      const candidate = join(base, build, "chrome-linux", "chrome");
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined; // fall back to playwright-core's bundled resolution
}

function startEchoServer() {
  const payload = {
    id: "ch_3PqL2aX9",
    object: "charge",
    amount: 4200,
    currency: "usd",
    status: "succeeded",
    paid: true,
    created: 1733570400,
    customer: { id: "cus_Nf8x21", email: "ada@example.com" },
    receipt_url: "https://pay.example.com/receipts/ch_3PqL2aX9",
  };
  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, {
        "content-type": "application/json",
        "x-request-id": "req_8Fq2Lm",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(payload));
    });
    server.listen(ECHO_PORT, "127.0.0.1", () => resolve(server));
  });
}

// Pre-seed the browser so the Collection and History rails look alive.
function seedScript() {
  const req = (method, url) => ({
    method,
    url,
    params: [],
    headers: [{ id: "h", key: "", value: "", enabled: true }],
    bodyMode: "none",
    body: "",
    auth: { mode: "none", token: "", username: "", password: "" },
  });
  const saved = [
    { id: "s1", name: "List user repos", createdAt: Date.now(), request: req("GET", "https://api.github.com/users/octocat/repos?per_page=20") },
    { id: "s2", name: "Create charge", createdAt: Date.now(), request: req("POST", "https://api.stripe.com/v1/charges") },
    { id: "s3", name: "Current forecast", createdAt: Date.now(), request: req("GET", "https://api.open-meteo.com/v1/forecast?latitude=37.77") },
  ];
  const now = Date.now();
  const history = [
    { id: "h1", method: "GET", url: "https://api.github.com/users/octocat", status: 200, timeMs: 142, createdAt: now - 60000, request: req("GET", "https://api.github.com/users/octocat") },
    { id: "h2", method: "POST", url: "https://api.stripe.com/v1/charges", status: 402, timeMs: 311, createdAt: now - 240000, request: req("POST", "https://api.stripe.com/v1/charges") },
    { id: "h3", method: "GET", url: "https://api.open-meteo.com/v1/forecast", status: 200, timeMs: 88, createdAt: now - 900000, request: req("GET", "https://api.open-meteo.com/v1/forecast") },
  ];
  return `
    localStorage.setItem('testmyapi.saved.v1', '${JSON.stringify(saved)}');
    localStorage.setItem('testmyapi.history.v1', '${JSON.stringify(history)}');
  `;
}

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(450); // let fonts paint
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const echo = await startEchoServer();
  const browser = await chromium.launch({
    executablePath: resolveChromium(),
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1320, height: 820 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    });
    await page.addInitScript(seedScript());

    const requestPanel = page.locator("section").first();
    const responsePanel = page.locator("section").nth(1);
    const url = page.getByLabel("Request URL");

    // 1) Request composer — query params synced from the URL, Collection populated.
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await url.fill("https://api.github.com/repos/VihanPandya/TestMyAPI/commits?per_page=10&sha=main");
    await url.blur();
    await settle(page);
    await page.screenshot({ path: join(OUT_DIR, "compose.png") });

    // 2) A completed request — POST a JSON body and inspect the response.
    await page.getByLabel("HTTP method").selectOption("POST");
    await url.fill(`http://127.0.0.1:${ECHO_PORT}/v1/charges`);
    await requestPanel.getByRole("tab", { name: "Body" }).click();
    await requestPanel.getByRole("button", { name: "JSON" }).click();
    await requestPanel
      .locator("textarea")
      .fill('{\n  "amount": 4200,\n  "currency": "usd",\n  "source": "tok_visa"\n}');
    await page.getByRole("button", { name: /send/i }).click();
    await responsePanel.getByText(/\b200\b/).first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT_DIR, "response.png") });

    // 3) The command palette.
    await page.getByRole("button", { name: "Open command palette" }).click();
    await page.getByPlaceholder("Type a command…").waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT_DIR, "palette.png") });

    console.log(`Saved screenshots to ${OUT_DIR}/`);
  } finally {
    await browser.close();
    echo.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
