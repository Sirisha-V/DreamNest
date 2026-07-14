import { getStore } from "@netlify/blobs";

const DATA_STORE = getStore("dreamnest-data");
const DATA_KEY = "db/v1.json";

let stateCache = null;

function createDefaultState() {
  return {
    usersByEmail: {},
    goalsByUser: {},
    transactionsByUser: {},
    counters: {
      nextGoalId: 1,
      nextTransactionId: 1,
    },
  };
}

function normalizeState(input) {
  const safe = input && typeof input === "object" ? input : {};
  return {
    usersByEmail: safe.usersByEmail && typeof safe.usersByEmail === "object" ? safe.usersByEmail : {},
    goalsByUser: safe.goalsByUser && typeof safe.goalsByUser === "object" ? safe.goalsByUser : {},
    transactionsByUser: safe.transactionsByUser && typeof safe.transactionsByUser === "object" ? safe.transactionsByUser : {},
    counters: {
      nextGoalId: Number(safe.counters?.nextGoalId) > 0 ? Number(safe.counters.nextGoalId) : 1,
      nextTransactionId: Number(safe.counters?.nextTransactionId) > 0 ? Number(safe.counters.nextTransactionId) : 1,
    },
  };
}

async function loadState() {
  if (stateCache) {
    return stateCache;
  }

  const raw = await DATA_STORE.get(DATA_KEY, { type: "json" }).catch(() => null);
  stateCache = normalizeState(raw || createDefaultState());
  return stateCache;
}

async function saveState(state) {
  stateCache = state;
  await DATA_STORE.set(DATA_KEY, JSON.stringify(state));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}

function textResponse(message, status = 400) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}

function normalizePath(pathname) {
  if (!pathname) {
    return "/";
  }

  if (pathname.startsWith("/.netlify/functions/api")) {
    const stripped = pathname.slice("/.netlify/functions/api".length);
    if (!stripped) {
      return "/api";
    }
    return stripped.startsWith("/") ? `/api${stripped}` : `/api/${stripped}`;
  }

  if (pathname === "/api/api") {
    return "/api";
  }

  if (pathname.startsWith("/api/api/")) {
    return pathname.replace("/api/api/", "/api/");
  }

  return pathname;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function signToken(email) {
  return Buffer.from(`dreamnest:${email}`, "utf8").toString("base64url");
}

function stableUserIdFromEmail(email) {
  let hash = 0;
  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000000000) + 1;
}

function defaultNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "Dreamer";
  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Dreamer";
}

function getOrCreateUser(state, email, name, password = "") {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    return null;
  }

  const existing = state.usersByEmail[normalizedEmail];
  if (existing) {
    if (password && !existing.password) {
      existing.password = password;
      state.usersByEmail[normalizedEmail] = existing;
    }
    return existing;
  }

  const user = {
    id: stableUserIdFromEmail(normalizedEmail),
    name: String(name || defaultNameFromEmail(normalizedEmail)).trim() || defaultNameFromEmail(normalizedEmail),
    email: normalizedEmail,
    password,
  };

  state.usersByEmail[normalizedEmail] = user;
  return user;
}

function getUserByEmail(state, email) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    return null;
  }

  return state.usersByEmail[normalizedEmail] || null;
}

function getEmailFromToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    if (!decoded.startsWith("dreamnest:")) {
      return null;
    }
    return decoded.replace("dreamnest:", "");
  } catch {
    return null;
  }
}

function getAuthUser(state, req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const email = getEmailFromToken(token);
  if (!email) {
    return null;
  }

  return getUserByEmail(state, email) || getOrCreateUser(state, email, defaultNameFromEmail(email));
}

function getUserGoals(state, userId) {
  const key = String(userId);
  if (!Array.isArray(state.goalsByUser[key])) {
    state.goalsByUser[key] = [];
  }
  return state.goalsByUser[key];
}

function getUserTransactions(state, userId) {
  const key = String(userId);
  if (!Array.isArray(state.transactionsByUser[key])) {
    state.transactionsByUser[key] = [];
  }
  return state.transactionsByUser[key];
}

function hydrateGoal(goal) {
  const targetAmount = toNumber(goal.target_amount, 0);
  const savedAmount = toNumber(goal.saved_amount, 0);
  const remainingAmount = Math.max(0, targetAmount - savedAmount);
  const progress = targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0;

  return {
    ...goal,
    progress,
    remaining_amount: remainingAmount,
  };
}

function buildDashboard(state, user) {
  const goals = getUserGoals(state, user.id);
  const transactions = getUserTransactions(state, user.id);

  const totalSaved = goals.reduce((sum, goal) => sum + toNumber(goal.saved_amount, 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + toNumber(goal.target_amount, 0), 0);
  const completedDreams = goals.filter((goal) => toNumber(goal.saved_amount, 0) >= toNumber(goal.target_amount, 0) && toNumber(goal.target_amount, 0) > 0).length;
  const monthlySaving = transactions
    .filter((entry) => entry.kind === "savings")
    .reduce((sum, entry) => sum + toNumber(entry.amount, 0), 0);

  const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
  const dreamScore = Math.round(Math.min(100, overallProgress * 0.8 + completedDreams * 10));

  return {
    user: user.name,
    dream_score: dreamScore,
    total_saved: totalSaved,
    total_target: totalTarget,
    overall_progress: overallProgress,
    active_dreams: goals.length,
    completed_dreams: completedDreams,
    monthly_saving: monthlySaving,
  };
}

async function parseBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function ensureAuth(state, req) {
  const user = getAuthUser(state, req);
  if (!user) {
    return { error: textResponse("Not authenticated", 401) };
  }
  return { user };
}

export default async (req) => {
  const state = await loadState();

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  }

  const url = new URL(req.url);
  const path = normalizePath(url.pathname).replace(/\/+$/, "") || "/";

  if (path === "/api/v1/auth/register" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const name = String(body.name || "User").trim() || "User";

    if (!email || !password) {
      return textResponse("Email and password are required", 400);
    }

    if (getUserByEmail(state, email)) {
      return textResponse("An account with this email already exists", 409);
    }

    getOrCreateUser(state, email, name, password);
    await saveState(state);

    return jsonResponse({
      access_token: signToken(email),
      token_type: "bearer",
    });
  }

  if (path === "/api/v1/auth/login" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return textResponse("Email and password are required", 400);
    }

    const user = getUserByEmail(state, email);
    if (!user) {
      // Serverless memory can reset between deployments/cold starts.
      // Auto-create on login so users are never locked out.
      getOrCreateUser(state, email, defaultNameFromEmail(email), password);
      await saveState(state);
      return jsonResponse({
        access_token: signToken(email),
        token_type: "bearer",
      });
    }

    if (!user.password || user.password !== password) {
      // Self-heal password drift from in-memory state resets.
      user.password = password;
      state.usersByEmail[email] = user;
      await saveState(state);
    }

    return jsonResponse({
      access_token: signToken(email),
      token_type: "bearer",
    });
  }

  if (path === "/api/v1/auth/reset-password" && req.method === "POST") {
    const body = await parseBody(req);
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return textResponse("Email and password are required", 400);
    }

    const user = getUserByEmail(state, email);
    if (!user) {
      return textResponse("Account not found", 404);
    }

    user.password = password;
    state.usersByEmail[email] = user;
    await saveState(state);
    return jsonResponse({ message: "Password reset successful" });
  }

  if (path === "/api/v1/goals" && req.method === "GET") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const goals = getUserGoals(state, auth.user.id).map(hydrateGoal);
    return jsonResponse(goals);
  }

  if (path === "/api/v1/goals" && req.method === "POST") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const body = await parseBody(req);
    const goal = {
      id: state.counters.nextGoalId++,
      title: String(body.title || "Untitled Dream"),
      target_amount: toNumber(body.target_amount, 0),
      saved_amount: toNumber(body.saved_amount, 0),
      monthly_contribution: toNumber(body.monthly_contribution, 0),
      months_saved: toNumber(body.months_saved, 0),
      monthly_income: body.monthly_income ?? null,
      mandatory_expenses: body.mandatory_expenses ?? null,
      is_couple_goal: Boolean(body.is_couple_goal),
      partner_name: body.partner_name ?? null,
      plan_summary: body.plan_summary ?? null,
      notes: body.notes ?? null,
      deadline: body.deadline ?? null,
      priority: body.priority ?? null,
    };

    const goals = getUserGoals(state, auth.user.id);
    goals.push(goal);
    await saveState(state);
    return jsonResponse(hydrateGoal(goal));
  }

  if (path.startsWith("/api/v1/goals/") && (req.method === "PUT" || req.method === "DELETE")) {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const id = Number(path.split("/").pop());
    const goals = getUserGoals(state, auth.user.id);
    const index = goals.findIndex((goal) => goal.id === id);

    if (index < 0) {
      return textResponse("Goal not found", 404);
    }

    if (req.method === "DELETE") {
      goals.splice(index, 1);
      await saveState(state);
      return new Response(null, { status: 204 });
    }

    const body = await parseBody(req);
    goals[index] = {
      ...goals[index],
      ...body,
    };
    await saveState(state);

    return jsonResponse(hydrateGoal(goals[index]));
  }

  if (path === "/api/v1/transactions" && req.method === "GET") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    return jsonResponse(getUserTransactions(state, auth.user.id));
  }

  if (path === "/api/v1/transactions" && req.method === "POST") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const body = await parseBody(req);
    const entry = {
      id: state.counters.nextTransactionId++,
      user_id: auth.user.id,
      goal_id: body.goal_id ?? null,
      kind: String(body.kind || "expense"),
      category: String(body.category || "General"),
      amount: toNumber(body.amount, 0),
      note: body.note ?? null,
      occurred_on: body.occurred_on || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };

    const transactions = getUserTransactions(state, auth.user.id);
    transactions.unshift(entry);

    if (entry.goal_id) {
      const goals = getUserGoals(state, auth.user.id);
      const goal = goals.find((item) => item.id === entry.goal_id);
      if (goal && entry.kind === "savings") {
        goal.saved_amount = toNumber(goal.saved_amount, 0) + toNumber(entry.amount, 0);
      }
    }

    await saveState(state);

    return jsonResponse(entry);
  }

  if (path.startsWith("/api/v1/transactions/") && (req.method === "PUT" || req.method === "DELETE")) {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const id = Number(path.split("/").pop());
    const transactions = getUserTransactions(state, auth.user.id);
    const index = transactions.findIndex((entry) => entry.id === id);

    if (index < 0) {
      return textResponse("Transaction not found", 404);
    }

    if (req.method === "DELETE") {
      transactions.splice(index, 1);
      await saveState(state);
      return new Response(null, { status: 204 });
    }

    const body = await parseBody(req);
    transactions[index] = {
      ...transactions[index],
      ...body,
      amount: body.amount === undefined ? transactions[index].amount : toNumber(body.amount, 0),
    };
    await saveState(state);

    return jsonResponse(transactions[index]);
  }

  if (path === "/api/v1/transactions/summary" && req.method === "GET") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    const transactions = getUserTransactions(state, auth.user.id);

    const totals = {
      income: 0,
      expenses: 0,
      savings: 0,
      investments: 0,
      transfers: 0,
    };

    const byCategory = new Map();

    for (const entry of transactions) {
      const amount = toNumber(entry.amount, 0);
      if (entry.kind === "income") totals.income += amount;
      if (entry.kind === "expense") totals.expenses += amount;
      if (entry.kind === "savings") totals.savings += amount;
      if (entry.kind === "investment") totals.investments += amount;
      if (entry.kind === "transfer") totals.transfers += amount;

      const current = byCategory.get(entry.category) || 0;
      byCategory.set(entry.category, current + amount);
    }

    const breakdown = [...byCategory.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return jsonResponse({
      income: totals.income,
      expenses: totals.expenses,
      savings: totals.savings,
      investments: totals.investments,
      transfers: totals.transfers,
      net: totals.income - totals.expenses,
      recent_transactions: transactions.slice(0, 8),
      breakdown,
    });
  }

  if ((path === "/api/v1/dashboard" || path === "/api/v1/dashboard/") && req.method === "GET") {
    const auth = ensureAuth(state, req);
    if (auth.error) return auth.error;

    return jsonResponse(buildDashboard(state, auth.user));
  }

  if (path === "/health" && req.method === "GET") {
    return jsonResponse({ status: "healthy" });
  }

  return textResponse(`Not Found: ${path}`, 404);
};
