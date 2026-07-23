// @raheja/shared/server — the server-only half of this package.
//
// Everything here pulls in firebase-admin (a Node-only SDK that touches
// `net`, `tls`, etc.) and/or bcryptjs used for PIN hashing. None of it
// may be re-exported from the package's main barrel (./index.ts),
// because that barrel is imported by ordinary Client Components across
// both apps (login pages, catalogue, cart, ...) — pulling firebase-admin
// into that graph breaks the browser build with errors like
// "Module not found: Can't resolve 'net'".
//
// Import this subpath explicitly, and only from code that is guaranteed
// to run on the server: Next.js Server Actions ("use server" files),
// Route Handlers, and Cloud Functions.
export * from "./firebase/admin";
export * from "./auth/pin";
export * from "./settings-server";
