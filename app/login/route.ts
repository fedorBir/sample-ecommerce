import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function handle(request: Request) {
  return NextResponse.redirect(new URL("/account/login", request.url));
}

export const GET = handle;
