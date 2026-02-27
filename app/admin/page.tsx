"use client";
import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import styles from "../../Styles/admin.module.css";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TokenUsage {
  id: string;
  userId: string;
  userEmail: string;
  functionName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: any;
}

interface UserStats {
  email: string;
  totalCost: number;
  totalTokens: number;
  requestCount: number;
}

interface FirebaseStats {
  totalCost: number;
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  operationBreakdown: {
    [collection: string]: {
      reads: number;
      writes: number;
      deletes: number;
      cost: number;
    };
  };
}

interface NotifSummary {
  total: number;
  withPrompt: number;
  read: number;
  feedbackGiven: number;
  pushSubscribers: number;
}

interface UserNotifStats {
  email: string;
  userId: string;
  received: number;
  opened: number;
  feedbackCount: number;
  hasPush: boolean;
  lastNudgeDate: string;
}

interface RecentNotif {
  id: string;
  userId: string;
  userEmail: string;
  milestoneTitle: string;
  createdAt: any;
  read: boolean;
  feedback: string | null;
  aiSummary: string | null;
  type: string;
}

interface UserPlan {
  id: string;
  goal: string;
  goalType: string;
  status: string;
  createdAt: any;
  milestoneCount: number;
}

interface UserNudge {
  id: string;
  planId: string | null;
  milestoneTitle: string;
  prompt: string;
  createdAt: any;
  read: boolean;
  aiSummary: string | null;
  emailSent: boolean;
}

const ADMIN_EMAIL = "zakaria.akli.ensa@gmail.com";
const NOTIF_PAGE_SIZE = 50;

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  // Auth
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [firebaseStats, setFirebaseStats] = useState<FirebaseStats>({
    totalCost: 0,
    totalReads: 0,
    totalWrites: 0,
    totalDeletes: 0,
    operationBreakdown: {},
  });

  // API Testing tab
  const [apiResults, setApiResults] = useState<{ [key: string]: any }>({});

  // Notifications tab — raw data
  const [notifSummary, setNotifSummary] = useState<NotifSummary>({
    total: 0,
    withPrompt: 0,
    read: 0,
    feedbackGiven: 0,
    pushSubscribers: 0,
  });
  const [userNotifStats, setUserNotifStats] = useState<UserNotifStats[]>([]);
  const [allNotifs, setAllNotifs] = useState<RecentNotif[]>([]);

  // Users tab
  const [allUserList, setAllUserList] = useState<{ uid: string; email: string }[]>([]);
  const [usersTab_selectedUser, setUsersTab_selectedUser] = useState<string>("");
  const [usersTab_plans, setUsersTab_plans] = useState<UserPlan[]>([]);
  const [usersTab_nudges, setUsersTab_nudges] = useState<UserNudge[]>([]);
  const [usersTab_expandedPlans, setUsersTab_expandedPlans] = useState<Set<string>>(new Set());
  const [usersTab_expandedNudges, setUsersTab_expandedNudges] = useState<Set<string>>(new Set());
  const [usersTab_loading, setUsersTab_loading] = useState(false);

  // Notifications tab — filters
  const [notifFilterUser, setNotifFilterUser] = useState<string>("all");
  const [notifFilterMilestone, setNotifFilterMilestone] =
    useState<string>("all");
  const [notifFilterRead, setNotifFilterRead] = useState<string>("all");
  const [notifFilterFeedback, setNotifFilterFeedback] = useState<string>("all");
  const [notifFilterDateFrom, setNotifFilterDateFrom] = useState<string>("");
  const [notifFilterDateTo, setNotifFilterDateTo] = useState<string>("");
  const [notifPage, setNotifPage] = useState(0);

  // ─── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.email === ADMIN_EMAIL);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadTokenUsageData();
      loadFirebaseUsageData();
      loadNotificationData();
    }
  }, [isAdmin]);

  // Re-query token usage when function filter changes
  useEffect(() => {
    if (isAdmin) loadTokenUsageData();
  }, [selectedFunction, dateRange]);

  // ─── Data loaders ──────────────────────────────────────────────────────────

  const loadTokenUsageData = async () => {
    try {
      setLoading(true);
      const tokenQuery =
        selectedFunction !== "all"
          ? query(
              collection(db, "tokenUsage"),
              where("functionName", "==", selectedFunction),
              orderBy("timestamp", "desc"),
            )
          : query(collection(db, "tokenUsage"), orderBy("timestamp", "desc"));

      const snapshot = await getDocs(tokenQuery);
      const usages: TokenUsage[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as TokenUsage,
      );

      setTokenUsages(usages);
      setTotalCost(usages.reduce((s, u) => s + (u.cost || 0), 0));
      setTotalTokens(usages.reduce((s, u) => s + u.totalTokens, 0));

      const statsMap = new Map<string, UserStats>();
      usages.forEach((u) => {
        const s = statsMap.get(u.userEmail) || {
          email: u.userEmail,
          totalCost: 0,
          totalTokens: 0,
          requestCount: 0,
        };
        s.totalCost += u.cost || 0;
        s.totalTokens += u.totalTokens;
        s.requestCount++;
        statsMap.set(u.userEmail, s);
      });
      setUserStats(
        Array.from(statsMap.values()).sort((a, b) => b.totalCost - a.totalCost),
      );
    } catch (err) {
      console.error("❌ Error loading token usage:", err);
      setTokenUsages([]);
      setUserStats([]);
      setTotalCost(0);
      setTotalTokens(0);
    } finally {
      setLoading(false);
    }
  };

  const loadFirebaseUsageData = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "firebaseUsage"), orderBy("timestamp", "desc")),
      );
      let totalCost = 0,
        totalReads = 0,
        totalWrites = 0,
        totalDeletes = 0;
      const operationBreakdown: FirebaseStats["operationBreakdown"] = {};

      snapshot.forEach((doc) => {
        const d = doc.data();
        totalCost += d.cost || 0;
        if (d.operation === "read") totalReads += d.documentCount || 0;
        if (d.operation === "write") totalWrites += d.documentCount || 0;
        if (d.operation === "delete") totalDeletes += d.documentCount || 0;

        const col = d.collection || "unknown";
        if (!operationBreakdown[col])
          operationBreakdown[col] = {
            reads: 0,
            writes: 0,
            deletes: 0,
            cost: 0,
          };
        if (d.operation === "read")
          operationBreakdown[col].reads += d.documentCount || 0;
        if (d.operation === "write")
          operationBreakdown[col].writes += d.documentCount || 0;
        if (d.operation === "delete")
          operationBreakdown[col].deletes += d.documentCount || 0;
        operationBreakdown[col].cost += d.cost || 0;
      });

      setFirebaseStats({
        totalCost,
        totalReads,
        totalWrites,
        totalDeletes,
        operationBreakdown,
      });
    } catch (err) {
      console.error("❌ Error loading Firebase usage:", err);
    }
  };

  const loadNotificationData = async () => {
    try {
      // Load all notifications (admin-only, ~500-1000 docs — client-side is fine)
      const notifsSnap = await getDocs(
        query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      );

      // Load push subscriptions
      const pushSnap = await getDocs(collection(db, "pushSubscriptions"));
      const activePushUserIds = new Set<string>();
      pushSnap.forEach((doc) => {
        if (doc.data().active) activePushUserIds.add(doc.id);
      });

      // Load users for email mapping
      const usersSnap = await getDocs(collection(db, "users"));
      const userEmailMap = new Map<string, string>();
      usersSnap.forEach((doc) => {
        const d = doc.data();
        userEmailMap.set(doc.id, d.email || d.userEmail || doc.id);
      });

      // Aggregate
      let total = 0,
        withPrompt = 0,
        read = 0,
        feedbackGiven = 0;
      const perUser = new Map<
        string,
        {
          received: number;
          opened: number;
          feedbackCount: number;
          lastNudgeDate: any;
        }
      >();
      const notifs: RecentNotif[] = [];

      notifsSnap.forEach((doc) => {
        const d = doc.data();
        const userId = d.userId;
        total++;
        if (d.prompt) withPrompt++;
        if (d.read) read++;
        if (d.feedbackDetails?.aiSummary) feedbackGiven++;

        const u = perUser.get(userId) || {
          received: 0,
          opened: 0,
          feedbackCount: 0,
          lastNudgeDate: null,
        };
        u.received++;
        if (d.read) u.opened++;
        if (d.feedback) u.feedbackCount++;
        if (!u.lastNudgeDate) u.lastNudgeDate = d.createdAt;
        perUser.set(userId, u);

        notifs.push({
          id: doc.id,
          userId,
          userEmail: userEmailMap.get(userId) || userId,
          milestoneTitle: d.milestoneTitle || d.type || "—",
          createdAt: d.createdAt,
          read: !!d.read,
          feedback: d.feedback || null,
          aiSummary: d.feedbackDetails?.aiSummary || null,
          type: d.type || "",
        });
      });

      setNotifSummary({
        total,
        withPrompt,
        read,
        feedbackGiven,
        pushSubscribers: activePushUserIds.size,
      });
      setAllNotifs(notifs);

      const userNotifs: UserNotifStats[] = [];
      perUser.forEach((stats, userId) => {
        userNotifs.push({
          email: userEmailMap.get(userId) || userId,
          userId,
          received: stats.received,
          opened: stats.opened,
          feedbackCount: stats.feedbackCount,
          hasPush: activePushUserIds.has(userId),
          lastNudgeDate: formatDate(stats.lastNudgeDate),
        });
      });
      setUserNotifStats(userNotifs.sort((a, b) => b.received - a.received));

      // Populate user list for Users tab (reuse already-fetched users)
      const list = Array.from(userEmailMap.entries())
        .map(([uid, email]) => ({ uid, email }))
        .sort((a, b) => a.email.localeCompare(b.email));
      setAllUserList(list);
    } catch (err) {
      console.error("❌ Error loading notification data:", err);
    }
  };

  const loadUserDetails = async (userId: string) => {
    setUsersTab_loading(true);
    setUsersTab_expandedPlans(new Set());
    setUsersTab_expandedNudges(new Set());
    try {
      const [plansSnap, nudgesSnap] = await Promise.all([
        getDocs(query(collection(db, "plans"), where("userId", "==", userId), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "notifications"), where("userId", "==", userId), orderBy("createdAt", "desc"))),
      ]);

      const wizardStatuses = new Set(["framed", "drafted", "finalized", "error"]);
      setUsersTab_plans(
        plansSnap.docs
          .filter((doc) => !wizardStatuses.has(doc.data().status))
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              goal: d.goal || "—",
              goalType: d.goalType || "",
              status: d.status || "active",
              createdAt: d.createdAt,
              milestoneCount: d.milestones?.length || 0,
            };
          })
      );

      setUsersTab_nudges(nudgesSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          planId: d.planId || null,
          milestoneTitle: d.milestoneTitle || "—",
          prompt: d.prompt || "",
          createdAt: d.createdAt,
          read: !!d.read,
          aiSummary: d.feedbackDetails?.aiSummary || null,
          emailSent: d.emailStatus?.sent || false,
        };
      }));
    } catch (err) {
      console.error("❌ Error loading user details:", err);
    } finally {
      setUsersTab_loading(false);
    }
  };

  // ─── Derived: filter options (built from full dataset, not current page) ───

  const allUsers = useMemo(
    () => Array.from(new Set(allNotifs.map((n) => n.userEmail))).sort(),
    [allNotifs],
  );

  const allMilestones = useMemo(
    () =>
      Array.from(new Set(allNotifs.map((n) => n.milestoneTitle)))
        .filter((t) => t !== "—")
        .sort(),
    [allNotifs],
  );

  // ─── Derived: filtered + paginated notifications ───────────────────────────

  const filteredNotifs = useMemo(() => {
    return allNotifs.filter((n) => {
      if (notifFilterUser !== "all" && n.userEmail !== notifFilterUser)
        return false;
      if (
        notifFilterMilestone !== "all" &&
        n.milestoneTitle !== notifFilterMilestone
      )
        return false;
      if (notifFilterRead === "read" && !n.read) return false;
      if (notifFilterRead === "unread" && n.read) return false;
      if (notifFilterFeedback === "with" && !n.aiSummary) return false;
      if (notifFilterFeedback === "without" && n.aiSummary) return false;
      if (notifFilterDateFrom || notifFilterDateTo) {
        let date: Date;
        try {
          date = n.createdAt?.toDate?.() || new Date(n.createdAt);
        } catch {
          return true;
        }
        if (notifFilterDateFrom && date < new Date(notifFilterDateFrom))
          return false;
        if (notifFilterDateTo) {
          const to = new Date(notifFilterDateTo);
          to.setHours(23, 59, 59, 999);
          if (date > to) return false;
        }
      }
      return true;
    });
  }, [
    allNotifs,
    notifFilterUser,
    notifFilterMilestone,
    notifFilterRead,
    notifFilterFeedback,
    notifFilterDateFrom,
    notifFilterDateTo,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setNotifPage(0);
  }, [
    notifFilterUser,
    notifFilterMilestone,
    notifFilterRead,
    notifFilterFeedback,
    notifFilterDateFrom,
    notifFilterDateTo,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifs.length / NOTIF_PAGE_SIZE),
  );
  const safePage = Math.min(notifPage, totalPages - 1);
  const pageNotifs = filteredNotifs.slice(
    safePage * NOTIF_PAGE_SIZE,
    (safePage + 1) * NOTIF_PAGE_SIZE,
  );

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatTokens = (tokens: number) => tokens.toLocaleString();

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate?.() ?? new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  const getFunctionDisplayName = (fn: string) =>
    (
      ({
        openai_questions: "Question Generation",
        openai_milestones: "Milestone Generation",
        openai_nudges: "Weekly Milestone Nudges",
        openai_daily_nudges: "Daily Nudge Generation",
        openai_feedback: "Feedback Processing",
        enneagram_chat_conversation: "Enneagram Test Chat",
        enneagram_result_parsing: "Enneagram Result Processing",
        test_function: "Test Function",
      }) as Record<string, string>
    )[fn] || fn;

  // ─── API Testing ───────────────────────────────────────────────────────────

  const apiEndpoints = [
    {
      name: "Milestone Reminders (with Email)",
      endpoint: "/api/milestoneReminders",
      method: "POST",
    },
    {
      name: "Track OpenAI Usage",
      endpoint: "/api/track-openai-usage",
      method: "GET",
    },
  ];

  const callApi = async (endpoint: string, method: string, name: string) => {
    setApiResults((prev) => ({ ...prev, [name]: { loading: true } }));
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setApiResults((prev) => ({
        ...prev,
        [name]: {
          loading: false,
          success: response.ok,
          status: response.status,
          data,
          timestamp: new Date().toLocaleString(),
        },
      }));
    } catch (error) {
      setApiResults((prev) => ({
        ...prev,
        [name]: {
          loading: false,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toLocaleString(),
        },
      }));
    }
  };

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading admin dashboard...</div>
      </div>
    );
  if (!user)
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h1>Access Denied</h1>
          <p>Please log in.</p>
        </div>
      </div>
    );
  if (!isAdmin)
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h1>Access Denied</h1>
          <p>You do not have permission.</p>
        </div>
      </div>
    );

  const uniqueFunctions = Array.from(
    new Set(tokenUsages.map((u) => u.functionName)),
  );

  // ─── Pagination controls (reusable inline) ─────────────────────────────────

  const PaginationBar = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "0.75rem 0",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        {filteredNotifs.length} results — page {safePage + 1} of {totalPages}
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {[
          {
            label: "Previous",
            disabled: safePage === 0,
            onClick: () => setNotifPage((p) => Math.max(p - 1, 0)),
          },
          {
            label: "Next",
            disabled: safePage >= totalPages - 1,
            onClick: () => setNotifPage((p) => Math.min(p + 1, totalPages - 1)),
          },
        ].map(({ label, disabled, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={disabled}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              background: disabled ? "#f3f4f6" : "white",
              color: disabled ? "#9ca3af" : "#374151",
              cursor: disabled ? "default" : "pointer",
              fontSize: "0.8rem",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔧 Admin Dashboard</h1>
        <p className={styles.subtitle}>OpenAI Token Usage & Cost Monitoring</p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        {[
          { id: "dashboard", label: "📊 Dashboard" },
          { id: "notifications", label: "🔔 Notifications" },
          { id: "users", label: "👥 Users" },
          { id: "api-testing", label: "🚀 API Testing" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notifications Tab ──────────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <>
          {/* Summary cards */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Notification Delivery Overview
            </h2>
            <div className={styles.summaryCards}>
              {[
                {
                  label: "Total Nudges",
                  icon: "🔔",
                  value: notifSummary.withPrompt,
                  sub: `${notifSummary.total - notifSummary.withPrompt} pending`,
                },
                {
                  label: "Open Rate",
                  icon: "👁",
                  sub: `${notifSummary.read} / ${notifSummary.withPrompt} opened`,
                  value:
                    notifSummary.withPrompt > 0
                      ? `${Math.round((notifSummary.read / notifSummary.withPrompt) * 100)}%`
                      : "—",
                },
                {
                  label: "Push Subscribers",
                  icon: "📱",
                  value: notifSummary.pushSubscribers,
                  sub: `${notifSummary.feedbackGiven} feedback given`,
                },
              ].map(({ label, icon, value, sub }) => (
                <div key={label} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{label}</h3>
                    <span className={styles.icon}>{icon}</span>
                  </div>
                  <div className={styles.cardValue}>{value}</div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-user engagement */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Per-User Engagement</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Received</th>
                    <th>Opened</th>
                    <th>Open Rate</th>
                    <th>Push</th>
                    <th>Feedback</th>
                    <th>Last Nudge</th>
                  </tr>
                </thead>
                <tbody>
                  {userNotifStats.map((u) => (
                    <tr key={u.userId}>
                      <td>{u.email}</td>
                      <td>{u.received}</td>
                      <td>{u.opened}</td>
                      <td>
                        {u.received > 0
                          ? `${Math.round((u.opened / u.received) * 100)}%`
                          : "—"}
                      </td>
                      <td>{u.hasPush ? "✅" : "❌"}</td>
                      <td>{u.feedbackCount}</td>
                      <td>{u.lastNudgeDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications log with filters */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications Log</h2>

            {/* Filters */}
            <div className={styles.filters} style={{ flexWrap: "wrap" }}>
              <div className={styles.filterGroup}>
                <label>From</label>
                <input
                  type="date"
                  className={styles.select}
                  value={notifFilterDateFrom}
                  onChange={(e) => setNotifFilterDateFrom(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>To</label>
                <input
                  type="date"
                  className={styles.select}
                  value={notifFilterDateTo}
                  onChange={(e) => setNotifFilterDateTo(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <label>User</label>
                <select
                  className={styles.select}
                  value={notifFilterUser}
                  onChange={(e) => setNotifFilterUser(e.target.value)}
                >
                  <option value="all">All Users</option>
                  {allUsers.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Milestone</label>
                <select
                  className={styles.select}
                  value={notifFilterMilestone}
                  onChange={(e) => setNotifFilterMilestone(e.target.value)}
                >
                  <option value="all">All Milestones</option>
                  {allMilestones.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Read</label>
                <select
                  className={styles.select}
                  value={notifFilterRead}
                  onChange={(e) => setNotifFilterRead(e.target.value)}
                  style={{ minWidth: "120px" }}
                >
                  <option value="all">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Feedback</label>
                <select
                  className={styles.select}
                  value={notifFilterFeedback}
                  onChange={(e) => setNotifFilterFeedback(e.target.value)}
                  style={{ minWidth: "140px" }}
                >
                  <option value="all">All</option>
                  <option value="with">With Feedback</option>
                  <option value="without">No Feedback</option>
                </select>
              </div>
            </div>

            <PaginationBar />

            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Milestone</th>
                    <th>Read</th>
                    <th>AI Reflection</th>
                  </tr>
                </thead>
                <tbody>
                  {pageNotifs.map((n) => (
                    <tr key={n.id}>
                      <td>{formatDate(n.createdAt)}</td>
                      <td>{n.userEmail}</td>
                      <td>{n.milestoneTitle}</td>
                      <td>{n.read ? "✅" : "⬜"}</td>
                      <td
                        style={{
                          maxWidth: "320px",
                          fontSize: "0.8rem",
                          color: n.aiSummary ? "#374151" : "#9ca3af",
                        }}
                      >
                        {n.aiSummary || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationBar />
          </div>
        </>
      )}

      {/* ── Users Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>User Activity</h2>

          {/* User selector */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Select User</label>
              <select
                className={styles.select}
                value={usersTab_selectedUser}
                onChange={(e) => {
                  setUsersTab_selectedUser(e.target.value);
                  if (e.target.value) loadUserDetails(e.target.value);
                  else {
                    setUsersTab_plans([]);
                    setUsersTab_nudges([]);
                  }
                }}
                style={{ minWidth: "280px" }}
              >
                <option value="">— Select a user —</option>
                {allUserList.map((u) => (
                  <option key={u.uid} value={u.uid}>{u.email}</option>
                ))}
              </select>
            </div>
          </div>

          {!usersTab_selectedUser && (
            <p style={{ color: "#9ca3af", marginTop: "1.5rem", fontSize: "0.9rem" }}>
              Select a user to view their plans and nudges.
            </p>
          )}

          {usersTab_loading && (
            <p style={{ color: "#6b7280", marginTop: "1.5rem", fontSize: "0.9rem" }}>Loading...</p>
          )}

          {usersTab_selectedUser && !usersTab_loading && (
            <>
              {/* Plans */}
              {usersTab_plans.length === 0 ? (
                <p style={{ color: "#9ca3af", marginTop: "1.5rem", fontSize: "0.9rem" }}>No plans found for this user.</p>
              ) : (
                <>
                  <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
                    Plans ({usersTab_plans.length})
                  </h3>
                  {usersTab_plans.map((plan) => {
                    const planNudges = usersTab_nudges.filter((n) => n.planId === plan.id);
                    const isExpanded = usersTab_expandedPlans.has(plan.id);
                    const statusColors: Record<string, { bg: string; color: string }> = {
                      active: { bg: "#d1fae5", color: "#047857" },
                      completed: { bg: "#dbeafe", color: "#1d4ed8" },
                      paused: { bg: "#fef3c7", color: "#92400e" },
                    };
                    const sc = statusColors[plan.status] || statusColors.paused;
                    return (
                      <div key={plan.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "0.75rem", overflow: "hidden" }}>
                        {/* Plan header — clickable to expand */}
                        <div
                          onClick={() => setUsersTab_expandedPlans((prev) => {
                            const next = new Set(prev);
                            next.has(plan.id) ? next.delete(plan.id) : next.add(plan.id);
                            return next;
                          })}
                          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "#f9fafb", cursor: "pointer" }}
                        >
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "999px", background: sc.bg, color: sc.color, flexShrink: 0 }}>
                            {plan.status}
                          </span>
                          <span style={{ fontWeight: 500, color: "#111827", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {plan.goal}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#6b7280", flexShrink: 0 }}>{plan.milestoneCount} milestones</span>
                          <span style={{ fontSize: "0.75rem", color: "#6b7280", flexShrink: 0 }}>{planNudges.length} nudges</span>
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af", flexShrink: 0 }}>{formatDate(plan.createdAt)}</span>
                          <span style={{ fontSize: "0.7rem", color: "#9ca3af", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>

                        {/* Nudge list */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid #e5e7eb" }}>
                            {planNudges.length === 0 ? (
                              <p style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>No nudges for this plan.</p>
                            ) : (
                              planNudges.map((nudge) => {
                                const nudgeExpanded = usersTab_expandedNudges.has(nudge.id);
                                return (
                                  <div key={nudge.id} style={{ borderBottom: "1px solid #f3f4f6", background: "white" }}>
                                    {/* Nudge row — clickable to expand */}
                                    <div
                                      onClick={() => setUsersTab_expandedNudges((prev) => {
                                        const next = new Set(prev);
                                        next.has(nudge.id) ? next.delete(nudge.id) : next.add(nudge.id);
                                        return next;
                                      })}
                                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", padding: "0.75rem 1rem", cursor: "pointer" }}
                                    >
                                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formatDate(nudge.createdAt)}</span>
                                      <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: nudge.read ? "#d1fae5" : "#f3f4f6", color: nudge.read ? "#047857" : "#6b7280" }}>
                                        {nudge.read ? "read" : "unread"}
                                      </span>
                                      {nudge.aiSummary && (
                                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9" }}>reflected</span>
                                      )}
                                      {nudge.emailSent && (
                                        <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: "#dbeafe", color: "#1d4ed8" }}>email sent</span>
                                      )}
                                      <span style={{ fontSize: "0.8rem", color: "#374151", flex: 1 }}>{nudge.milestoneTitle}</span>
                                      <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{nudgeExpanded ? "▲" : "▼"}</span>
                                    </div>
                                    {/* Expanded: nudge prompt + AI summary */}
                                    {nudgeExpanded && (
                                      <div style={{ padding: "0 1rem 0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#111827", lineHeight: 1.6, background: "#f9fafb", borderRadius: "6px", padding: "0.75rem", borderLeft: "3px solid #6366f1" }}>
                                          {nudge.prompt || "—"}
                                        </p>
                                        {nudge.aiSummary && (
                                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.5, borderLeft: "3px solid #ede9fe", paddingLeft: "0.5rem" }}>
                                            <strong style={{ color: "#6d28d9", fontSize: "0.7rem" }}>REFLECTION: </strong>{nudge.aiSummary}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* General reminders (nudges not linked to any plan) */}
              {(() => {
                const generalNudges = usersTab_nudges.filter((n) => !n.planId);
                if (generalNudges.length === 0) return null;
                return (
                  <>
                    <h3 style={{ margin: "1.5rem 0 0.75rem", fontSize: "1rem", fontWeight: 600, color: "#374151" }}>
                      General Reminders ({generalNudges.length})
                    </h3>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                      {generalNudges.map((nudge) => (
                        <div key={nudge.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6", background: "white", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formatDate(nudge.createdAt)}</span>
                          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: nudge.read ? "#d1fae5" : "#f3f4f6", color: nudge.read ? "#047857" : "#6b7280" }}>
                            {nudge.read ? "read" : "unread"}
                          </span>
                          {nudge.aiSummary && (
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: "#ede9fe", color: "#6d28d9" }}>reflected</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── API Testing Tab ────────────────────────────────────────────────── */}
      {activeTab === "api-testing" && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 API Testing Panel</h2>
          <p className={styles.subtitle}>
            Test all available API endpoints with one click
          </p>
          <div className={styles.apiGrid}>
            {apiEndpoints.map((api) => (
              <div key={api.name} className={styles.apiCard}>
                <div className={styles.apiCardHeader}>
                  <h3>{api.name}</h3>
                  <span className={styles.method}>{api.method}</span>
                </div>
                <div className={styles.apiCardBody}>
                  <p className={styles.endpoint}>{api.endpoint}</p>
                  <button
                    className={styles.apiButton}
                    onClick={() => callApi(api.endpoint, api.method, api.name)}
                    disabled={apiResults[api.name]?.loading}
                  >
                    {apiResults[api.name]?.loading
                      ? "⏳ Testing..."
                      : "🚀 Test API"}
                  </button>
                  {apiResults[api.name] && !apiResults[api.name].loading && (
                    <div
                      className={`${styles.apiResult} ${apiResults[api.name].success ? styles.success : styles.error}`}
                    >
                      <div className={styles.resultHeader}>
                        <span className={styles.status}>
                          {apiResults[api.name].success
                            ? "✅ Success"
                            : "❌ Error"}{" "}
                          ({apiResults[api.name].status || "N/A"})
                        </span>
                        <span className={styles.timestamp}>
                          {apiResults[api.name].timestamp}
                        </span>
                      </div>
                      <pre className={styles.resultData}>
                        {JSON.stringify(
                          apiResults[api.name].data ||
                            apiResults[api.name].error,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dashboard Tab ──────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label htmlFor="function-select">Function:</label>
              <select
                id="function-select"
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Functions</option>
                {uniqueFunctions.map((fn) => (
                  <option key={fn} value={fn}>
                    {getFunctionDisplayName(fn)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="date-range">Date Range:</label>
              <select
                id="date-range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={styles.select}
              >
                <option value="1day">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>

          {/* OpenAI Summary */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>OpenAI Usage Summary</h2>
            <div className={styles.summaryCards}>
              {[
                {
                  label: "OpenAI Cost",
                  icon: "🤖",
                  value: formatCost(totalCost),
                },
                {
                  label: "Total Tokens",
                  icon: "🎯",
                  value: formatTokens(totalTokens),
                },
                { label: "API Calls", icon: "📊", value: tokenUsages.length },
                { label: "Active Users", icon: "👥", value: userStats.length },
              ].map(({ label, icon, value }) => (
                <div key={label} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{label}</h3>
                    <span className={styles.icon}>{icon}</span>
                  </div>
                  <div className={styles.cardValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Firebase Summary */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Firebase Usage Summary</h2>
            <div className={styles.summaryCards}>
              {[
                {
                  label: "Firebase Cost",
                  icon: "🔥",
                  value: formatCost(firebaseStats.totalCost),
                },
                {
                  label: "Reads",
                  icon: "👀",
                  value: firebaseStats.totalReads.toLocaleString(),
                },
                {
                  label: "Writes",
                  icon: "✍️",
                  value: firebaseStats.totalWrites.toLocaleString(),
                },
                {
                  label: "Deletes",
                  icon: "🗑️",
                  value: firebaseStats.totalDeletes.toLocaleString(),
                },
              ].map(({ label, icon, value }) => (
                <div key={label} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{label}</h3>
                    <span className={styles.icon}>{icon}</span>
                  </div>
                  <div className={styles.cardValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined cost */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Total Infrastructure Cost</h2>
            <div className={styles.summaryCards}>
              <div
                className={styles.card}
                style={{ background: "#1A1714", color: "white" }}
              >
                <div className={styles.cardHeader}>
                  <h3>Combined Total</h3>
                  <span className={styles.icon}>💎</span>
                </div>
                <div className={styles.cardValue}>
                  {formatCost(totalCost + firebaseStats.totalCost)}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.8,
                    marginTop: "0.5rem",
                  }}
                >
                  OpenAI: {formatCost(totalCost)} + Firebase:{" "}
                  {formatCost(firebaseStats.totalCost)}
                </div>
              </div>
            </div>
          </div>

          {/* Firebase collection breakdown */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Firebase Collection Usage</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Collection</th>
                    <th>Reads</th>
                    <th>Writes</th>
                    <th>Deletes</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(firebaseStats.operationBreakdown).map(
                    ([col, stats]) => (
                      <tr key={col}>
                        <td>{col}</td>
                        <td>{stats.reads.toLocaleString()}</td>
                        <td>{stats.writes.toLocaleString()}</td>
                        <td>{stats.deletes.toLocaleString()}</td>
                        <td>{formatCost(stats.cost)}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User cost analysis */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>User Cost Analysis</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>Total Cost</th>
                    <th>Total Tokens</th>
                    <th>API Calls</th>
                    <th>Avg Cost/Call</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((s, i) => (
                    <tr key={i}>
                      <td>{s.email}</td>
                      <td>{formatCost(s.totalCost)}</td>
                      <td>{formatTokens(s.totalTokens)}</td>
                      <td>{s.requestCount}</td>
                      <td>{formatCost(s.totalCost / s.requestCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed usage log */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Detailed Usage Log</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Function</th>
                    <th>Prompt Tokens</th>
                    <th>Completion Tokens</th>
                    <th>Total Tokens</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenUsages.slice(0, 100).map((u) => (
                    <tr key={u.id}>
                      <td>{formatDate(u.timestamp)}</td>
                      <td>{u.userEmail}</td>
                      <td>{getFunctionDisplayName(u.functionName)}</td>
                      <td>{formatTokens(u.promptTokens)}</td>
                      <td>{formatTokens(u.completionTokens)}</td>
                      <td>{formatTokens(u.totalTokens)}</td>
                      <td>{formatCost(u.cost || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tokenUsages.length > 100 && (
              <p className={styles.note}>
                Showing first 100 records. Use filters to narrow down.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
