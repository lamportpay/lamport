import { useRouterState } from "@tanstack/react-router";

import { GTM_ID, GTM_SNIPPET, tagManagerAllowed } from "@/lib/tag-manager";

/** Google Tag Manager on every page except admin (see `tagManagerAllowed`). */
export function GoogleTagManager() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!tagManagerAllowed(pathname)) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GTM_SNIPPET }} />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
