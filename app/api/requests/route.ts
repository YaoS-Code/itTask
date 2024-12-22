// app/api/requests/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function GET() {
  // Fetch all requests from the database
  const requests = db.prepare('SELECT * FROM requests ORDER BY id DESC').all();
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      requester_name, 
      requester_email, 
      request_type, 
      requested_date, 
      notes 
    } = data;

    // Split the request_type to get authorized_by and authorized_email
    const [authorized_by, authorized_email] = request_type.split(':');

    const info = db
      .prepare(
        `INSERT INTO requests 
          (requester_name, requester_email, request_type, authorized_by, authorized_email, requested_date, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        requester_name, 
        requester_email, 
        request_type, 
        authorized_by || 'Unknown',  // Provide default value if null
        authorized_email || 'no-email',  // Provide default value if null
        requested_date, 
        notes
      );

    const requestId = info.lastInsertRowid;

    // Send Emails Asynchronously
    const emailPromises = [
      sendEmail(
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
      ),
      sendEmail(
        authorized_email,
        'Data Request Approval Needed',
        `
          <p>A new data request has been submitted by ${requester_name}:</p>
          <ul>
            <li><strong>Email:</strong> ${requester_email}</li>
            <li><strong>Type:</strong> ${request_type}</li>
            <li><strong>Date Needed:</strong> ${requested_date}</li>
            <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
          </ul>
          <p>Please approve or reject the request using the links below:</p>
          <a href="${process.env.APP_BASE_URL}/api/requests/${requestId}/approve" style="color: green;">Approve</a> |
          <a href="${process.env.APP_BASE_URL}/api/requests/${requestId}/reject" style="color: red;">Reject</a>
          <p>If you need more details, please reply with your questions.</p>
        `
      )
    ];

    Promise.all(emailPromises)
      .then(() => {
        console.log('All emails sent successfully.');
      })
      .catch((error) => {
        console.error('Error sending emails:', error);
      });

    return Response.json({ id: requestId });
  } catch (error) {
    console.error('Error in POST /api/requests:', error);
    return Response.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
