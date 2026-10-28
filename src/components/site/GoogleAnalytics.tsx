import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ANALYTICS_ID, COOKIE_KEY, COOKIE_CHANGE_EVENT, readCookieChoice, analyticsPath } from "@/lib/analytics-consent";

type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/** Only public page paths; never send search params, identities, forms or app activity. */
export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const win = window as AnalyticsWindow;
    const path = analyticsPath(pathname);
    let sent = false;
    const disabledKey = `ga-disable-${ANALYTICS_ID}`;
    const setDisabled = (value: boolean) => Reflect.set(win, disabledKey, value);
    const apply = () => {
      let choice = null;
      try { choice = readCookieChoice(window.localStorage.getItem(COOKIE_KEY)); } catch { /* fail closed */ }
      if (choice !== "all" || !path) {
        setDisabled(true);
        win.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        sent = false;
        if (choice !== "all") {
          for (const cookie of document.cookie.split(";")) {
            const name = cookie.split("=")[0]?.trim();
            if (!name?.startsWith("_ga")) continue;
            const domains = ["", window.location.hostname, `.${window.location.hostname}`];
            const parts = window.location.hostname.split(".");
            if (parts.length > 2) domains.push(`.${parts.slice(-2).join(".")}`);
            for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
          }
        }
        return;
      }
      setDisabled(false);
      if (!win.gtag) {
        win.dataLayer = win.dataLayer || [];
        win.gtag = function (..._args: unknown[]) {
          // Google expects an Arguments object, not an array.
          // eslint-disable-next-line prefer-rest-params
          win.dataLayer?.push(arguments);
        };
        win.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        win.gtag("set", "developer_id.dZjgwMW", true);
        win.gtag("js", new Date());
        win.gtag("config", ANALYTICS_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ignore_referrer: true, page_location: `${window.location.origin}${path}`, page_referrer: "", page_title: "LamportPay" });
        const script = document.createElement("script");
        script.id = "lamportpay-google-analytics";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
        document.head.appendChild(script);
      }
      win.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      if (!sent) {
        win.gtag("event", "page_view", { page_path: path, page_location: `${window.location.origin}${path}`, page_referrer: "", page_title: "LamportPay" });
        sent = true;
      }
    };
    apply();
    window.addEventListener(COOKIE_CHANGE_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      setDisabled(true);
      win.gtag?.("consent", "update", { analytics_storage: "denied" });
      window.removeEventListener(COOKIE_CHANGE_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, [pathname]);
  return null;
}