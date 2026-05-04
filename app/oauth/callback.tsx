import { Redirect } from "expo-router";

// The OAuth deep link `volvo-companion://oauth/callback?code=...&state=...` is
// normally intercepted by `WebBrowser.openAuthSessionAsync`'s listener and
// never reaches the router. But on Android the OS still routes the intent to
// MainActivity, which expo-router resolves before/alongside the listener — so
// without an explicit route here the router falls back to its `Unmatched`
// component, which calls `Linking.createURL()` and throws because we don't
// expose a JS-side `scheme:` in app.config.ts. This route absorbs the URL
// silently and redirects to root. The auth session itself is finalised by
// the module-load WebBrowser.maybeCompleteAuthSession() call in
// AuthProvider.tsx, which fires before this route renders.
export default function OAuthCallback(): JSX.Element {
  return <Redirect href="/" />;
}
