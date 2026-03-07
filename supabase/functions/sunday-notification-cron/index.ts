import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authentication (cron or admin)
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

    // Check if today is Sunday
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday

    if (dayOfWeek !== 0) {
      return new Response(
        JSON.stringify({ message: 'Not Sunday, skipping notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Sunday notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('sunday_notification_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Failed to get settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.enabled) {
      return new Response(
        JSON.stringify({ message: 'Sunday notifications are disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all device tokens
    const { data: devices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('device_token');

    if (devicesError) {
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No devices registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = devices.map((d) => d.device_token);

    // Prepare push messages
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: settings.title,
      body: settings.body,
      data: {
        type: 'sunday_service',
        id: '',
      },
    }));

    // Send to Expo Push API
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
      title: settings.title,
      body: settings.body,
      type: 'sunday_service',
      content_id: null,
      sent_count: sentCount,
      failed_count: failedCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sunday notification sent',
        sent: sentCount,
        failed: failedCount,
        total: tokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending Sunday notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
