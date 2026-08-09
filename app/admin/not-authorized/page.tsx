import { logoutAction } from "@/app/admin/actions";

export default function NotAuthorized() {
  return <main className="center-page"><h1>Access not approved</h1><p>This account does not have active PDTV Newsroom access.</p><form action={logoutAction}><button>Sign out</button></form></main>;
}

