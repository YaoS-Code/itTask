// app/api/requests/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  // Fetch all requests from the database
  const requests = db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
  return NextResponse.json(requests);
}

import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requester_name, requester_email, request_type, requested_date, notes } = body;

    if (!requester_name || !requester_email || !request_type || !requested_date) {
      console.error('Missing required fields:', { requester_name, requester_email, request_type, requested_date });
      return new Response('Invalid data', { status: 400 });
    }

    const info = db
      .prepare(
        `INSERT INTO requests 
          (requester_name, requester_email, request_type, requested_date, notes) 
          VALUES (?, ?, ?, ?, ?)`
      )
      .run(requester_name, requester_email, request_type, requested_date, notes);

    const requestId = info.lastInsertRowid;

    // Generate Approve and Reject Links
    const approveLink = `${process.env.APP_BASE_URL}/api/requests/${requestId}/approve`;
    const rejectLink = `${process.env.APP_BASE_URL}/api/requests/${requestId}/reject`;

    // Send Email to IT Manager
    await sendEmail(
      'it@mmcwellness.ca',
      'New Data Request Submitted',
      `
        <p>A new data request has been submitted:</p>
        <ul>
          <li><strong>Requester:</strong> ${requester_name}</li>
          <li><strong>Email:</strong> ${requester_email}</li>
          <li><strong>Type:</strong> ${request_type}</li>
          <li><strong>Date Needed:</strong> ${requested_date}</li>
          <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
        </ul>
        <p>Check the dashboard for further action.</p>
      `
    );

    // Send Email to CEO
    await sendEmail(
      'it@mmcwellness.ca',
      'Approve or Reject Data Request',
      `
        <p>A new data request has been submitted by ${requester_name}:</p>
        <ul>
          <li><strong>Email:</strong> ${requester_email}</li>
          <li><strong>Type:</strong> ${request_type}</li>
          <li><strong>Date Needed:</strong> ${requested_date}</li>
          <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
        </ul>
        <p>Approve or reject the request using the links below:</p>
        <a href="${approveLink}" style="color: green;">Approve</a> | <a href="${rejectLink}" style="color: red;">Reject</a>
      `
    );

    return new Response(JSON.stringify({ success: true, id: requestId }), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/requests:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
