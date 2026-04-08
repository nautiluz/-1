import { NextRequest, NextResponse } from 'next/server';
import { createOAuth2Client, getTokensFromCode } from '@/lib/gmail/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    const oauth2Client = await createOAuth2Client();
    const tokens = await getTokensFromCode(oauth2Client, code);

    const tokenString = JSON.stringify(tokens);
    const encodedTokens = Buffer.from(tokenString).toString('base64');

    return NextResponse.redirect(new URL(`/?tokens=${encodedTokens}`, request.url));
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}