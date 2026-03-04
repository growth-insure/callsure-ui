import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const extension = searchParams.get('extension');
    const call_date_start = searchParams.get('call_date_start');
    const call_date_end = searchParams.get('call_date_end');

    // console.log('GET /api/action-items/bulk - Received parameters:', {
    //   extension,
    //   call_date_start,
    //   call_date_end,
    //   url: request.url
    // });

    // Validate parameters
    const extensionStr = String(extension || '').trim();
    const dateStartStr = String(call_date_start || '').trim();
    const dateEndStr = String(call_date_end || '').trim();
    
    if (!extensionStr || !dateStartStr || !dateEndStr) {
      const missing = [];
      if (!extensionStr) missing.push('extension');
      if (!dateStartStr) missing.push('call_date_start');
      if (!dateEndStr) missing.push('call_date_end');
      
      const errorResponse = {
        error: "Missing required parameters",
        missing: missing,
        provided: {
          extension: extension || null,
          call_date_start: call_date_start || null,
          call_date_end: call_date_end || null
        }
      };
      
      console.error('GET /api/action-items/bulk - Validation failed:', errorResponse);
      
      return NextResponse.json(
        errorResponse,
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    // Fetch all action items for this extension within the date range
    const fetchUrl = `${supabaseUrl}/rest/v1/action_items?extension=eq.${extensionStr}&call_date=gte.${dateStartStr}&call_date=lte.${dateEndStr}&select=*`;
    
    // console.log('Fetching action items from:', fetchUrl);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error fetching action items:", response.status, errorText);
      
      // Check if it's a column not found error
      let errorMessage = `Failed to fetch action items: ${response.status}`;
      if (errorText.includes('column') || errorText.includes('does not exist')) {
        errorMessage = `Table column error: The action_items table may be missing 'extension' or 'call_date' columns. Please add these columns to your table. Original error: ${errorText}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          status: response.status 
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    const data = await response.json();
    
    // console.log(`Fetched ${data.length} action items for extension ${extensionStr} between ${dateStartStr} and ${dateEndStr}`);
    
    return NextResponse.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

