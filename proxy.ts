import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  /*
   * Default homepage language = Sindhi
   *
   * /            -> /?lang=sd
   * /?lang=en    -> English
   * /?lang=ur    -> Urdu
   * /?lang=sd    -> Sindhi
   */
  if (
    request.nextUrl.pathname === "/" &&
    !request.nextUrl.searchParams.has("lang")
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", "sd");

    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(
          ({ name, value, options }) => {
            response.cookies.set(name, value, options);
          }
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};