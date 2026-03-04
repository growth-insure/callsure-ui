import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { audio_file_id, extension, date, todoItems } = await request.json();

    if (!audio_file_id || !extension || !date || !todoItems) {
      return NextResponse.json(
        { error: "audio_file_id, extension, date, and todoItems are required" },
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

    // Check if record exists for this extension, call_date, and audio_file_id combination
    const checkUrl = `${supabaseUrl}/rest/v1/action_items?audio_file_id=eq.${audio_file_id}&extension=eq.${extension}&call_date=eq.${date}&select=id`;
    
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation',
      },
    });

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error("Error checking for existing record:", checkResponse.status, errorText);
      
        // Check if it's a column not found error
      let errorMessage = `Failed to check for existing record: ${checkResponse.status}`;
      if (errorText.includes('column') || errorText.includes('does not exist')) {
        errorMessage = `Table column error: The action_items table may be missing 'extension' or 'call_date' columns. Please add these columns to your table. Original error: ${errorText}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          status: checkResponse.status 
        },
        { status: checkResponse.status >= 400 && checkResponse.status < 500 ? checkResponse.status : 500 }
      );
    }

    const existingRecords = await checkResponse.json();
    
    if (existingRecords && existingRecords.length > 0) {
      // Update existing record
      const recordId = existingRecords[0].id;
      const updateUrl = `${supabaseUrl}/rest/v1/action_items?id=eq.${recordId}`;
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          todo_items: todoItems,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Error updating record:", updateResponse.status, errorText);
        return NextResponse.json(
          { error: `Failed to update record: ${updateResponse.status}` },
          { status: 500 }
        );
      }

      const updatedRecord = await updateResponse.json();
      return NextResponse.json({
        success: true,
        message: "Action items updated successfully",
        data: updatedRecord[0],
      });
    } else {
      // Create new record
      const insertUrl = `${supabaseUrl}/rest/v1/action_items`;
      
      const insertResponse = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          audio_file_id,
          extension,
          call_date: date,
          todo_items: todoItems,
        }),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error("Error creating record:", insertResponse.status, errorText);
        return NextResponse.json(
          { error: `Failed to create record: ${insertResponse.status}` },
          { status: 500 }
        );
      }

      const newRecord = await insertResponse.json();
      return NextResponse.json({
        success: true,
        message: "Action items created successfully",
        data: newRecord[0] || newRecord,
      });
    }

  } catch (error) {
    console.error("Error in action-items API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audio_file_id = searchParams.get('audio_file_id');
    const extension = searchParams.get('extension');
    const date = searchParams.get('date');

    // console.log('GET /api/action-items - Received parameters:', {
    //   audio_file_id,
    //   extension,
    //   date,
    //   url: request.url,
    //   audio_file_id_type: typeof audio_file_id,
    //   extension_type: typeof extension,
    //   date_type: typeof date
    // });

    // Check for missing or empty string values
    const audioFileIdStr = String(audio_file_id || '').trim();
    const extensionStr = String(extension || '').trim();
    const dateStr = String(date || '').trim();
    
    if (!audioFileIdStr || !extensionStr || !dateStr) {
      const missing = [];
      if (!audioFileIdStr) missing.push('audio_file_id');
      if (!extensionStr) missing.push('extension');
      if (!dateStr) missing.push('date');
      
      const errorResponse = {
        error: "Missing required parameters",
        missing: missing,
        provided: {
          audio_file_id: audio_file_id || null,
          extension: extension || null,
          date: date || null
        }
      };
      
      console.error('GET /api/action-items - Validation failed:', errorResponse);
      
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

    // Fetch action items for this extension, call_date, and audio_file_id
    const fetchUrl = `${supabaseUrl}/rest/v1/action_items?audio_file_id=eq.${audioFileIdStr}&extension=eq.${extensionStr}&call_date=eq.${dateStr}&select=*`;
    
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
    
    return NextResponse.json({
      success: true,
      data: data.length > 0 ? data[0] : null,
    });

  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

