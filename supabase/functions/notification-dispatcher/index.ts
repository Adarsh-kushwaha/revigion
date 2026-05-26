import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { dispatch, DbContext, FcmContext, FcmPayload } from './dispatcher.ts';
import { getGoogleAccessToken } from './google-auth.ts';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

/**
 * Build a real DbContext backed by the Supabase service-role client.
 */
function makeDbContext(supabaseUrl: string, serviceRoleKey: string): DbContext {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  return {
    async dueRevisions(slotAt: Date) {
      // Raw SQL via RPC is cleanest; use .rpc or .from with a manual query.
      // We use supabase-js's query builder with a raw SQL approach via
      // the PostgREST "select with joins" pattern.
      // For the NOT EXISTS filter we rely on the fact that the service role
      // bypasses RLS, so we do the join directly.
      const { data, error } = await supabase.rpc('get_due_revisions_for_slot', {
        p_slot_at: slotAt.toISOString(),
      });

      if (error) {
        throw new Error(`dueRevisions query failed: ${error.message}`);
      }

      return (data ?? []).map((row: {
        revision_id: string;
        question_id: string;
        question_title: string;
        user_id: string;
        token: string;
      }) => ({
        revision_id: row.revision_id,
        question_id: row.question_id,
        question_title: row.question_title,
        user_id: row.user_id,
        token: row.token,
      }));
    },

    async markSent(revisionId: string, slotAt: Date) {
      const { error } = await supabase
        .from('notifications_sent')
        .insert({ revision_id: revisionId, slot_at: slotAt.toISOString() });

      // Ignore unique-constraint violations (already sent — idempotent)
      if (error && !error.message.includes('duplicate key')) {
        throw new Error(`markSent failed: ${error.message}`);
      }
    },

    async deleteToken(token: string) {
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('token', token);

      if (error) {
        throw new Error(`deleteToken failed: ${error.message}`);
      }
    },
  };
}

/**
 * Build a real FcmContext that calls the FCM HTTP v1 API.
 */
function makeFcmContext(projectId: string, clientEmail: string, privateKey: string): FcmContext {
  // Normalise the private key — env vars often store \n as the literal two-char sequence \\n
  const normalizedKey = privateKey.replace(/\\n/g, '\n');
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // Cache the access token within one invocation
  let cachedToken: string | null = null;

  async function getToken(): Promise<string> {
    if (!cachedToken) {
      cachedToken = await getGoogleAccessToken(clientEmail, normalizedKey, FCM_SCOPE);
    }
    return cachedToken;
  }

  return {
    async send(token: string, payload: FcmPayload) {
      const accessToken = await getToken();

      const body = {
        message: {
          token,
          notification: payload.notification,
          data: payload.data,
        },
      };

      let response: Response;
      try {
        response = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        console.error('FCM fetch error:', err);
        return { ok: false, retire: false };
      }

      if (response.ok) {
        return { ok: true };
      }

      // 404 = unregistered token, 410 = token explicitly invalidated → retire
      if (response.status === 404 || response.status === 410) {
        return { ok: false, retire: true };
      }

      // Also check the FCM error body for UNREGISTERED
      try {
        const json = await response.json() as {
          error?: { details?: Array<{ errorCode?: string }> };
        };
        const errorCode = json?.error?.details?.[0]?.errorCode;
        if (errorCode === 'UNREGISTERED') {
          return { ok: false, retire: true };
        }
      } catch {
        // ignore JSON parse errors
      }

      console.error(`FCM error ${response.status} for token ${token.slice(0, 12)}...`);
      return { ok: false, retire: false };
    },
  };
}

serve(async (_req: Request): Promise<Response> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

    if (!supabaseUrl || !serviceRoleKey || !projectId || !clientEmail || !privateKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const db = makeDbContext(supabaseUrl, serviceRoleKey);
    const fcm = makeFcmContext(projectId, clientEmail, privateKey);

    const result = await dispatch(new Date(), { db, fcm });

    console.log('Dispatch complete:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Dispatcher error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
