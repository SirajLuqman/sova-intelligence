"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { AnimatePresence, motion } from "framer-motion";

import NavbarAdminForm from "@/app/admin/components/NavbarAdminForm";

import HeroAdminForm from "@/app/admin/components/HeroAdminForm";

import AboutAdminForm from "@/app/admin/components/AboutAdminForm";

import ExpertiseAdminForm from "@/app/admin/components/ExpertiseAdminForm";

import ProjectsAdminForm from "@/app/admin/components/ProjectsAdminForm";

import ServicesAdminForm from "@/app/admin/components/ServicesAdminForm";

import MethodologyAdminForm from "@/app/admin/components/MethodologyAdminForm";

import TeamAdminForm from "@/app/admin/components/TeamAdminForm";

import FooterAdminForm from "@/app/admin/components/FooterAdminForm";

import AuthenticationAdminForm from "@/app/admin/components/AuthenticationAdminForm";

import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  KeyRound,
  Layers,
  LogOut,
  PanelBottom,
  PanelTop,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type AdminRole = "OWNER" | "EDITOR";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}

type AdminHistoryType = "login-base" | "login" | "dashboard" | "section";

interface AdminHistoryState {
  sovaAdminHistory?: AdminHistoryType;
  adminSection?: string | null;
  adminOffset?: number;
}

/* =========================================================
   VALIDATION LIMITS
========================================================= */

const MAX_EMAIL_LENGTH = 50;

const MAX_PASSWORD_LENGTH = 50;

/* =========================================================
   EMAIL VALIDATION
========================================================= */

const isValidEmail = (value: string) => {
  const email = value.trim();

  if (!email) {
    return false;
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* =======================================================
     ADMIN SECTIONS
  ======================================================= */

const sections = [
  {
    id: "navbar",
    name: "Navigation Bar",
    icon: PanelTop,
    desc: "Logo & navigation",
  },
  {
    id: "hero",
    name: "Hero",
    icon: Sparkles,
    desc: "Headline & background",
  },
  {
    id: "about",
    name: "About",
    icon: FileText,
    desc: "Company information",
  },
  {
    id: "expertise",
    name: "Expertise",
    icon: Layers,
    desc: "Technical capabilities",
  },
  {
    id: "services",
    name: "Services",
    icon: Briefcase,
    desc: "Services & solutions",
  },
  {
    id: "projects",
    name: "Projects",
    icon: FolderGit2,
    desc: "Projects & partnerships",
  },
  {
    id: "methodology",
    name: "How We Work",
    icon: Workflow,
    desc: "Process & deliverables",
  },
  {
    id: "team",
    name: "Team",
    icon: Users,
    desc: "Team members",
  },
  {
    id: "footer",
    name: "Footer",
    icon: PanelBottom,
    desc: "Contact & social links",
  },
  {
    id: "authentication",
    name: "Authentication Management",
    icon: KeyRound,
    desc: "Manage admin accounts & access",
    ownerOnly: true,
  },
];

/* =========================================================
   ADMIN PORTAL
========================================================= */

export default function AdminPortal() {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [authError, setAuthError] = useState("");

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  /* =======================================================
     ACTIVE SECTION
  ======================================================= */

  const [activeSection, setActiveSection] = useState<string | null>(null);

  /* =======================================================
     AUTHENTICATION MANAGEMENT ACCESS
  ======================================================= */

  const canManageAuthentication = adminUser?.role === "OWNER";

  /*
   * Editors should not see Authentication Management.
   */
  const visibleSections = sections.filter(
    (section) => !section.ownerOnly || canManageAuthentication,
  );

  const activeSectionData = sections.find(
    (section) => section.id === activeSection,
  );

  /* =======================================================
     BROWSER HISTORY
  ======================================================= */

  /*
   * The history stack is deliberately separated from React
   * authentication state.
   *
   * Authenticated navigation:
   *
   * Login Base
   *     ↓
   * Login
   *     ↓
   * Dashboard
   *     ↓
   * Section
   *
   * The "Login Base" entry acts as a safe same-page anchor.
   *
   * When the user presses Back from Dashboard:
   *
   * Dashboard → Login
   *
   * the authenticated state is invalidated.
   *
   * The handler then moves back to Login Base and creates a
   * fresh Login entry with pushState().
   *
   * pushState() truncates all forward history.
   *
   * Therefore old Dashboard/Section entries cannot later be
   * restored with Chrome Forward.
   *
   * Example:
   *
   * Before Back:
   *
   * Login Base → Login → Dashboard → Services
   *
   * After Back from Dashboard:
   *
   * Login Base → Login
   *
   * Forward is no longer able to restore Dashboard or Services.
   *
   * Section navigation remains normal:
   *
   * Dashboard → Projects
   * Back     → Dashboard
   * Forward  → Projects
   */

  const isAuthenticatedRef = useRef(false);

  const adminUserRef = useRef<AdminUser | null>(null);

  /*
   * Tracks the current history offset from the Login Base.
   *
   * Login Base = 0
   * Login      = 1
   * Dashboard  = 2
   * Section    = 3+
   */
  const historyOffsetRef = useRef(0);

  /*
   * Used when intentionally moving back to the Login Base
   * in order to truncate authenticated forward history.
   */
  const historyCleanupRef = useRef(false);

  /*
   * Prevents the initial history setup from running more than
   * once during the component lifecycle.
   */
  const historyInitializedRef = useRef(false);

  const resetLoginState = () => {
    setActiveSection(null);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setEmailError("");
    setPasswordError("");
    setAuthError("");
  };

  const navigateToSection = (sectionId: string) => {
    const sectionData = sections.find((section) => section.id === sectionId);

    if (!sectionData) {
      return;
    }

    if (sectionData.ownerOnly && adminUserRef.current?.role !== "OWNER") {
      return;
    }

    const nextOffset = historyOffsetRef.current + 1;

    window.history.pushState(
      {
        sovaAdminHistory: "section",
        adminSection: sectionId,
        adminOffset: nextOffset,
      } satisfies AdminHistoryState,
      "",
      `/admin?section=${encodeURIComponent(sectionId)}`,
    );

    historyOffsetRef.current = nextOffset;

    setActiveSection(sectionId);
  };

  const navigateToDashboard = () => {
    const nextOffset = historyOffsetRef.current + 1;

    window.history.pushState(
      {
        sovaAdminHistory: "dashboard",
        adminSection: null,
        adminOffset: nextOffset,
      } satisfies AdminHistoryState,
      "",
      "/admin",
    );

    historyOffsetRef.current = nextOffset;

    setActiveSection(null);
  };

  useEffect(() => {
    if (historyInitializedRef.current) {
      return;
    }

    historyInitializedRef.current = true;

    /*
     * The current page is initially the Login Base.
     *
     * No additional history entry is created here.
     */
    window.history.replaceState(
      {
        sovaAdminHistory: "login-base",
        adminSection: null,
        adminOffset: 0,
      } satisfies AdminHistoryState,
      "",
      "/admin",
    );

    historyOffsetRef.current = 0;

    const handlePopState = () => {
      const historyState = window.history.state as AdminHistoryState | null;

      const historyType = historyState?.sovaAdminHistory;

      const historyOffset =
        typeof historyState?.adminOffset === "number"
          ? historyState.adminOffset
          : 0;

      const params = new URLSearchParams(window.location.search);

      const section = params.get("section");

      /* -----------------------------------------------------
         LOGIN BASE
      ----------------------------------------------------- */

      if (historyType === "login-base") {
        /*
         * This state is normally reached only while cleaning
         * authenticated forward history.
         *
         * Once here, create a fresh Login entry.
         *
         * pushState() removes every authenticated entry that
         * previously existed in the Forward direction.
         */
        if (historyCleanupRef.current) {
          historyCleanupRef.current = false;

          window.history.pushState(
            {
              sovaAdminHistory: "login",
              adminSection: null,
              adminOffset: 1,
            } satisfies AdminHistoryState,
            "",
            "/admin",
          );

          historyOffsetRef.current = 1;

          setIsAuthenticated(false);
          setAdminUser(null);

          resetLoginState();

          return;
        }

        /*
         * Normal Login Base navigation.
         */
        historyOffsetRef.current = historyOffset;

        setIsAuthenticated(false);
        setAdminUser(null);
        resetLoginState();

        return;
      }

      /* -----------------------------------------------------
         LOGIN
      ----------------------------------------------------- */

      if (historyType === "login") {
        historyOffsetRef.current = historyOffset;

        /*
         * If authenticated and the browser has moved Back from
         * Dashboard to Login, this is the authentication
         * boundary.
         *
         * Invalidate the server session and local auth state.
         *
         * Then move one step further back to Login Base.
         * The subsequent Login Base handler will push a fresh
         * Login entry, truncating all Forward history.
         */
        if (isAuthenticatedRef.current) {
          historyCleanupRef.current = true;

          fetch("/api/auth/logout", {
            method: "POST",
          }).catch((error) => {
            console.error("Browser history logout failed:", error);
          });

          isAuthenticatedRef.current = false;
          adminUserRef.current = null;

          setIsAuthenticated(false);
          setAdminUser(null);

          resetLoginState();

          /*
           * Login is immediately before Login Base.
           */
          window.history.back();

          return;
        }

        /*
         * Already unauthenticated.
         */
        setActiveSection(null);
        return;
      }

      /* -----------------------------------------------------
         DASHBOARD
      ----------------------------------------------------- */

      if (historyType === "dashboard") {
        historyOffsetRef.current = historyOffset;

        /*
         * Normal authenticated navigation:
         *
         * Section → Back → Dashboard
         */
        if (isAuthenticatedRef.current) {
          setActiveSection(null);
          return;
        }

        /*
         * An unauthenticated user must never be allowed to
         * restore an old authenticated Dashboard entry.
         *
         * Convert this entry into Login.
         */
        window.history.replaceState(
          {
            sovaAdminHistory: "login",
            adminSection: null,
            adminOffset: historyOffset,
          } satisfies AdminHistoryState,
          "",
          "/admin",
        );

        setActiveSection(null);
        resetLoginState();

        return;
      }

      /* -----------------------------------------------------
         SECTION
      ----------------------------------------------------- */

      if (historyType === "section") {
        historyOffsetRef.current = historyOffset;

        /*
         * Old authenticated sections must never restore after
         * authentication has been invalidated.
         */
        if (!isAuthenticatedRef.current) {
          window.history.replaceState(
            {
              sovaAdminHistory: "login",
              adminSection: null,
              adminOffset: historyOffset,
            } satisfies AdminHistoryState,
            "",
            "/admin",
          );

          setActiveSection(null);
          resetLoginState();

          return;
        }

        if (!section) {
          setActiveSection(null);
          return;
        }

        const sectionData = sections.find((item) => item.id === section);

        if (!sectionData) {
          window.history.replaceState(
            {
              sovaAdminHistory: "dashboard",
              adminSection: null,
              adminOffset: historyOffset,
            } satisfies AdminHistoryState,
            "",
            "/admin",
          );

          setActiveSection(null);

          return;
        }

        if (sectionData.ownerOnly && adminUserRef.current?.role !== "OWNER") {
          window.history.replaceState(
            {
              sovaAdminHistory: "dashboard",
              adminSection: null,
              adminOffset: historyOffset,
            } satisfies AdminHistoryState,
            "",
            "/admin",
          );

          setActiveSection(null);

          return;
        }

        /*
         * Normal section navigation.
         *
         * Example:
         *
         * Dashboard
         *    ↓
         * Projects
         *
         * Browser Back:
         *
         * Projects
         *    ↓
         * Dashboard
         *
         * Browser Forward:
         *
         * Dashboard
         *    ↓
         * Projects
         */
        setActiveSection(section);

        return;
      }

      /* -----------------------------------------------------
         UNKNOWN / LEGACY HISTORY ENTRY
      ----------------------------------------------------- */

      /*
       * Unknown history entries are never allowed to restore
       * an authenticated section.
       */
      setActiveSection(null);

      if (!isAuthenticatedRef.current) {
        resetLoginState();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /*
   * Keep refs synchronized with the latest React state.
   *
   * The browser-history listener intentionally has an empty
   * dependency array so it is registered only once.
   */
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    adminUserRef.current = adminUser;
  }, [adminUser]);

  /* =======================================================
   LOGIN VALIDATION
======================================================= */

  /* =======================================================
   LOGIN VALIDATION
======================================================= */

  const validateLogin = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setAuthError("");

    const trimmedEmail = email.trim();

    /* -----------------------------------------------------
     PASSWORD
  ----------------------------------------------------- */

    if (!password) {
      setPasswordError("Password is required.");

      valid = false;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      setPasswordError(
        `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`,
      );

      valid = false;
    }

    /* -----------------------------------------------------
     EMAIL
  ----------------------------------------------------- */

    if (!trimmedEmail) {
      setEmailError("Email address is required.");

      valid = false;
    } else if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      setEmailError(
        `Email address cannot exceed ${MAX_EMAIL_LENGTH} characters.`,
      );

      valid = false;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");

      valid = false;
    }

    return valid;
  };

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateLogin()) {
      return;
    }

    setIsLoggingIn(true);

    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data: {
        success?: boolean;
        user?: AdminUser;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.error || "Invalid email or password.");
      }

      if (data.user.role !== "OWNER" && data.user.role !== "EDITOR") {
        throw new Error("Invalid account role.");
      }

      /*
       * -----------------------------------------------------
       * AUTHENTICATED HISTORY CREATION
       * -----------------------------------------------------
       *
       * Current history:
       *
       * Login Base
       *
       * We convert the current Login entry into Login Base,
       * then create:
       *
       * Login Base → Login → Dashboard
       *
       * This gives us a dedicated Login entry immediately
       * before Dashboard while also giving us a safe anchor
       * that can be used to completely truncate authenticated
       * Forward history when authentication is invalidated.
       */

      window.history.replaceState(
        {
          sovaAdminHistory: "login-base",
          adminSection: null,
          adminOffset: 0,
        } satisfies AdminHistoryState,
        "",
        "/admin",
      );

      window.history.pushState(
        {
          sovaAdminHistory: "login",
          adminSection: null,
          adminOffset: 1,
        } satisfies AdminHistoryState,
        "",
        "/admin",
      );

      window.history.pushState(
        {
          sovaAdminHistory: "dashboard",
          adminSection: null,
          adminOffset: 2,
        } satisfies AdminHistoryState,
        "",
        "/admin",
      );

      historyOffsetRef.current = 2;

      isAuthenticatedRef.current = true;

      adminUserRef.current = data.user;

      setAdminUser(data.user);

      setIsAuthenticated(true);

      setEmail("");

      setPassword("");

      setShowPassword(false);

      setEmailError("");

      setPasswordError("");

      setAuthError("");

      setActiveSection(null);
    } catch (error) {
      console.error("Login failed:", error);

      setAuthError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      /*
       * Invalidate authentication immediately.
       */
      isAuthenticatedRef.current = false;

      adminUserRef.current = null;

      setIsAuthenticated(false);

      setAdminUser(null);

      setEmail("");

      setPassword("");

      setShowPassword(false);

      setEmailError("");

      setPasswordError("");

      setAuthError("");

      setActiveSection(null);

      /*
       * The current authenticated history entry has an offset
       * from Login Base.
       *
       * Going directly back to Login Base allows the following
       * popstate handler to push a fresh Login entry.
       *
       * Because pushState() is executed at Login Base, every
       * authenticated Forward entry is discarded.
       */
      const currentOffset = historyOffsetRef.current;

      if (currentOffset > 0) {
        historyCleanupRef.current = true;

        window.history.go(-currentOffset);

        return;
      }

      /*
       * Safety fallback.
       */
      window.history.replaceState(
        {
          sovaAdminHistory: "login",
          adminSection: null,
          adminOffset: 1,
        } satisfies AdminHistoryState,
        "",
        "/admin",
      );

      historyOffsetRef.current = 1;
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* =================================================
          LOGIN PAGE
      ================================================= */}

      {!isAuthenticated && (
        <motion.main
          key="login"
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -18,
            scale: 0.985,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="relative min-h-screen w-full overflow-hidden bg-[#EFECE6] px-5 py-10 font-sans text-stone-900 sm:px-6"
        >
          {/* Ambient background */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-amber-300/[0.13] blur-[140px]" />

            <div className="absolute -right-52 top-[15%] h-[620px] w-[620px] rounded-full bg-stone-400/[0.10] blur-[150px]" />

            <div className="absolute -bottom-56 left-[20%] h-[600px] w-[600px] rounded-full bg-amber-200/[0.12] blur-[150px]" />

            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.38] blur-[120px]" />

            <div
              className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")",
              }}
            />

            <div
              className="absolute inset-0 opacity-[0.018]"
              style={{
                backgroundImage: `
                  linear-gradient(#292524 1px, transparent 1px),
                  linear-gradient(90deg, #292524 1px, transparent 1px)
                `,
                backgroundSize: "48px 48px",
              }}
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(41,37,36,0.045)_100%)]" />
          </div>

          {/* Login content */}

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              delay: 0.05,
              ease: "easeOut",
            }}
            className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center"
          >
            <div className="w-full max-w-[440px]">
              {/* Brand */}

              <div className="mb-8 text-center">
                <div className="relative mx-auto mb-6 flex h-[92px] w-[92px] items-center justify-center">
                  <div className="absolute inset-0 rounded-[24px] border border-amber-300/70" />

                  <div className="absolute inset-[5px] overflow-hidden rounded-[20px] border-2 border-amber-100 bg-white shadow-[0_12px_35px_rgba(41,37,36,0.08)]">
                    <Image
                      src="/images/sova-logo.jpeg"
                      alt="SOVA"
                      fill
                      sizes="82px"
                      className="object-cover"
                    />
                  </div>

                  <div className="absolute -bottom-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_2px_10px_rgba(251,191,36,0.25)]" />
                </div>

                <div className="mb-3">
                  <h1 className="font-serif text-5xl font-medium tracking-[-0.04em] text-stone-950 sm:text-[54px]">
                    SOVA
                  </h1>

                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="h-px w-8 bg-stone-300" />

                    <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-stone-500">
                      Admin Portal
                    </p>

                    <span className="h-px w-8 bg-stone-300" />
                  </div>
                </div>
              </div>

              {/* Login card */}

              <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-6 shadow-[0_25px_80px_rgba(41,37,36,0.11)] backdrop-blur-xl sm:p-8">
                <form onSubmit={handleLogin} noValidate className="space-y-5">
                  {/* Email */}

                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600"
                    >
                      Email Address
                    </label>

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        const value = event.target.value.slice(
                          0,
                          MAX_EMAIL_LENGTH,
                        );

                        setEmail(value);
                        setEmailError("");
                        setAuthError("");
                      }}
                      maxLength={MAX_EMAIL_LENGTH}
                      autoComplete="email"
                      placeholder="admin@example.com"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={
                        emailError ? "admin-email-error" : undefined
                      }
                      className={`w-full rounded-xl border bg-[#FAF9F5] px-4 py-3.5 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:ring-2 ${
                        emailError
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-stone-300 focus:border-stone-900 focus:ring-stone-900/10"
                      }`}
                    />

                    {emailError && (
                      <p
                        id="admin-email-error"
                        className="mt-2 text-xs text-red-600"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="admin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          const value = event.target.value.slice(
                            0,
                            MAX_PASSWORD_LENGTH,
                          );

                          setPassword(value);
                          setPasswordError("");
                          setAuthError("");
                        }}
                        maxLength={MAX_PASSWORD_LENGTH}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        aria-invalid={Boolean(passwordError)}
                        aria-describedby={
                          passwordError ? "admin-password-error" : undefined
                        }
                        className={`w-full rounded-xl border bg-[#FAF9F5] px-4 py-3.5 pr-12 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:bg-white focus:ring-2 ${
                          passwordError
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-stone-300 focus:border-stone-900 focus:ring-stone-900/10"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {passwordError && (
                      <p
                        id="admin-password-error"
                        className="mt-2 text-xs text-red-600"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Authentication error */}

                  {authError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <p className="text-xs leading-5 text-red-600">
                        {authError}
                      </p>
                    </div>
                  )}

                  {/* Submit */}

                  <motion.button
                    type="submit"
                    disabled={isLoggingIn}
                    whileTap={{ scale: 0.985 }}
                    animate={{
                      scale: isLoggingIn ? 0.99 : 1,
                    }}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400 shadow-[0_8px_24px_rgba(28,25,23,0.12)] transition-all hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-[0_12px_30px_rgba(28,25,23,0.16)] focus:outline-none focus:ring-2 focus:ring-stone-900/20 active:translate-y-0 disabled:cursor-wait disabled:opacity-90"
                  >
                    {isLoggingIn ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-700 border-t-amber-400" />

                        <span>Signing In</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>

                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 border-t border-stone-100 pt-5">
                  <ShieldCheck className="h-3.5 w-3.5 text-stone-400" />

                  <span className="text-[10px] text-stone-400">
                    Authorized access only
                  </span>
                </div>
              </div>

              {/* Footer accent */}

              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-stone-300" />

                <span className="h-1 w-1 rounded-full bg-amber-400" />

                <span className="h-px w-8 bg-stone-300" />
              </div>
            </div>
          </motion.div>
        </motion.main>
      )}

      {/* =================================================
          MAIN ADMIN PORTAL
      ================================================= */}

      {isAuthenticated && (
        <motion.main
          key="admin"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 10,
          }}
          transition={{
            duration: 0.38,
            ease: "easeOut",
          }}
          className="relative min-h-screen overflow-hidden bg-[#EFECE6] font-sans text-stone-900"
        >
          {/* =================================================
              DASHBOARD AMBIENT BACKGROUND
          ================================================= */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-44 -top-52 h-[600px] w-[600px] rounded-full bg-amber-300/[0.16] blur-[135px]" />

            <div className="absolute right-[-220px] top-[5%] h-[620px] w-[620px] rounded-full bg-orange-300/[0.11] blur-[150px]" />

            <div className="absolute bottom-[-280px] left-[18%] h-[600px] w-[600px] rounded-full bg-sky-300/[0.08] blur-[150px]" />

            <div className="absolute bottom-[-240px] right-[12%] h-[500px] w-[500px] rounded-full bg-violet-300/[0.07] blur-[145px]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_52%)]" />

            <div
              className="absolute inset-0 opacity-[0.018]"
              style={{
                backgroundImage: `
                  linear-gradient(#292524 1px, transparent 1px),
                  linear-gradient(90deg, #292524 1px, transparent 1px)
                `,
                backgroundSize: "56px 56px",
              }}
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {/* =================================================
                DASHBOARD
            ================================================= */}

            {activeSection === null && (
              <motion.div
                key="dashboard"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                }}
                className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16"
              >
                {/* =================================================
                    DASHBOARD HEADER
                ================================================= */}

                <header className="mb-14">
                  <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-amber-700">
                          SOVA Admin Portal
                        </p>

                        <span className="h-px w-10 bg-amber-300" />
                      </div>

                      <h1 className="font-serif text-4xl font-normal tracking-[-0.04em] text-stone-950 sm:text-5xl lg:text-[56px]">
                        Welcome back.
                      </h1>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                        Manage your SOVA website content, presentation, and
                        administrative settings from one place.
                      </p>

                      {adminUser && (
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-stone-400">
                            Signed in as
                          </span>

                          <span className="text-[11px] font-semibold text-stone-800">
                            {adminUser.name}
                          </span>

                          <span className="h-3 w-px bg-stone-300" />

                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-600">
                            {adminUser.role === "OWNER" ? "Admin" : "Editor"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* =================================================
                        SIGN OUT
                    ================================================= */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group relative inline-flex w-fit shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border border-stone-900 bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-[0_7px_22px_rgba(41,37,36,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-stone-900 hover:text-amber-400 hover:shadow-[0_14px_30px_rgba(245,158,11,0.14)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 active:translate-y-0"
                    >
                      <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                      Sign Out
                    </button>
                  </div>

                  <div className="mt-9 h-px w-full bg-gradient-to-r from-amber-400 via-stone-300 to-transparent" />
                </header>

                {/* =================================================
                    SECTION LIBRARY
                ================================================= */}

                <section>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleSections.map((section, index) => {
                      const Icon = section.icon;

                      return (
                        <motion.button
                          key={section.id}
                          type="button"
                          onClick={() => navigateToSection(section.id)}
                          whileHover={{
                            y: -6,
                          }}
                          whileTap={{
                            scale: 0.985,
                          }}
                          transition={{
                            duration: 0.16,
                          }}
                          className="group relative flex min-h-[198px] flex-col justify-between overflow-hidden rounded-[22px] border border-stone-800/80 bg-white p-5 text-left shadow-[0_10px_32px_rgba(41,37,36,0.065)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-[0_24px_52px_rgba(41,37,36,0.13)] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          {/* Card background atmosphere */}

                          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-amber-200/50 blur-3xl opacity-0 transition-all duration-500 group-hover:opacity-100" />

                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0),rgba(250,248,242,0.7))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          {/* Card top */}

                          <div className="relative flex items-start justify-between">
                            <div className="flex items-center gap-3.5">
                              {/* SOVA ICON */}

                              <div className="relative flex h-12 w-12 items-center justify-center rounded-[15px] border border-stone-900 bg-stone-950 text-amber-400 shadow-[0_5px_15px_rgba(41,37,36,0.12)] transition-all duration-300 group-hover:scale-105 group-hover:border-stone-900 group-hover:bg-stone-950 group-hover:text-amber-400 group-hover:shadow-[0_10px_24px_rgba(28,25,23,0.22)]">
                                <Icon className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-110" />

                                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              </div>

                              <div>
                                <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400 transition-colors group-hover:text-stone-500">
                                  Section
                                </span>

                                <span className="mt-0.5 block text-[10px] font-bold tracking-[0.12em] text-stone-300 transition-colors group-hover:text-amber-600">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                              </div>
                            </div>

                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-stone-50 transition-all duration-300 group-hover:border-stone-950 group-hover:bg-stone-950">
                              <ChevronRight className="h-3.5 w-3.5 text-stone-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-amber-400" />
                            </div>
                          </div>

                          {/* Card content */}

                          <div className="relative mt-7">
                            <h3 className="text-[15px] font-bold tracking-[-0.01em] text-stone-900 transition-colors group-hover:text-stone-950">
                              {section.name}
                            </h3>

                            <p className="mt-1.5 max-w-[92%] text-xs leading-5 text-stone-500">
                              {section.desc}
                            </p>
                          </div>

                          {/* Bottom accent */}

                          <div className="absolute bottom-0 left-5 right-5 h-1 overflow-hidden rounded-full bg-stone-100">
                            <div className="h-full w-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transition-all duration-500 group-hover:w-full" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {/* =================================================
                EDITOR
            ================================================= */}

            {activeSection !== null && activeSectionData && (
              <motion.div
                key={activeSection}
                initial={{
                  opacity: 0,
                  x: 16,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -16,
                }}
                transition={{
                  duration: 0.22,
                  ease: "easeOut",
                }}
                className="relative z-10 mx-auto w-full max-w-5xl p-6 sm:p-10 lg:p-14"
              >
                <header className="mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      /*
                       * ProjectsAdminForm is unmounted here.
                       *
                       * Therefore any unsaved draft inside that
                       * component is automatically discarded.
                       */
                      navigateToDashboard();
                    }}
                    className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400 shadow-sm">
                      {(() => {
                        const ActiveIcon = activeSectionData.icon;

                        return <ActiveIcon className="h-5 w-5" />;
                      })()}
                    </div>

                    <div>
                      <h1 className="font-serif text-3xl font-normal tracking-tight text-stone-950 sm:text-4xl">
                        {activeSectionData.name}
                      </h1>

                      <p className="mt-1 text-sm text-stone-500">
                        {activeSectionData.desc}
                      </p>
                    </div>
                  </div>
                </header>

                <>
                  {activeSection === "navbar" && <NavbarAdminForm />}

                  {activeSection === "hero" && <HeroAdminForm />}

                  {activeSection === "about" && <AboutAdminForm />}

                  {activeSection === "expertise" && <ExpertiseAdminForm />}

                  {activeSection === "services" && <ServicesAdminForm />}

                  {activeSection === "projects" && <ProjectsAdminForm />}

                  {activeSection === "methodology" && <MethodologyAdminForm />}

                  {activeSection === "team" && <TeamAdminForm />}

                  {activeSection === "footer" && <FooterAdminForm />}

                  {activeSection === "authentication" &&
                    canManageAuthentication && <AuthenticationAdminForm />}
                </>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
