import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface RequestBody {
  title: string;
  body: string;
  type: 'sermon' | 'event' | 'announcement' | 'seminar' | 'sunday_service' | 'custom';
  contentId?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { title, body, type, contentId, data }: RequestBody = await req.json();

    if (!title || !body || !type) {
      return new Response(
        JSON.stringify({ error: 'title, body, and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all device tokens with their notification preferences
    const { data: devices, error: devicesError } = await supabase
      .from('device_tokens')
      .select(`
        device_token,
        notification_preferences (
          new_sermons,
          new_events,
          new_announcements
        )
      `);

    if (devicesError) {
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No devices registered', sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter tokens based on preferences
    const filteredTokens = devices
      .filter((device) => {
        const prefs = device.notification_preferences?.[0];
        if (!prefs) return true; // No preferences = receive all

        switch (type) {
          case 'sermon':
            return prefs.new_sermons !== false;
          case 'event':
            return prefs.new_events !== false;
          case 'announcement':
            return prefs.new_announcements !== false;
          case 'seminar':
          case 'sunday_service':
          case 'custom':
            return true; // Always send these
          default:
            return true;
        }
      })
      .map((device) => device.device_token);

    if (filteredTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No eligible devices', sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare push messages for Expo
    const messages: PushMessage[] = filteredTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        type,
        id: contentId || '',
        ...data,
      },
    }));

    // Send to Expo Push API in batches of 100
    const BATCH_SIZE = 100;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();

      if (result.data) {
        result.data.forEach((item: { status: string }) => {
          if (item.status === 'ok') {
            sentCount++;
          } else {
            failedCount++;
          }
        });
      }
    }

    // Log the notification
    await supabase.from('notification_logs').insert({
      title,
      body,
      type,
      content_id: contentId || null,
      sent_count: sentCount,
      failed_count: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent`,
        sent: sentCount,
        failed: failedCount,
        total: filteredTokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
