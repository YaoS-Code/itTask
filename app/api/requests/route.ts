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
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              .button { display: inline-block; padding: 10px 20px; margin: 10px 5px; text-decoration: none; border-radius: 5px; }
              .approve { background: #4CAF50; color: white !important; }
              .reject { background: #f44336; color: white !important; }
            </style>
          </head>
          <body>
            <p>A new data request has been submitted:</p>
            <ul>
              <li><strong>Requester:</strong> ${requester_name}</li>
              <li><strong>Email:</strong> ${requester_email}</li>
              <li><strong>Type:</strong> ${request_type}</li>
              <li><strong>Date Needed:</strong> ${requested_date}</li>
              <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
            </ul>
            <p>Check the dashboard for further action.</p>
          </body>
          </html>
        `
      ),
      sendEmail(
        authorized_email,
        'Data Request Approval Needed',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
              .button { display: inline-block; padding: 10px 20px; margin: 10px 5px; text-decoration: none; border-radius: 5px; }
              .approve { background: #4CAF50; color: white !important; }
              .reject { background: #f44336; color: white !important; }
            </style>
          </head>
          <body>
            <p>A new data request has been submitted by ${requester_name}:</p>
            <ul>
              <li><strong>Email:</strong> ${requester_email}</li>
              <li><strong>Type:</strong> ${request_type}</li>
              <li><strong>Date Needed:</strong> ${requested_date}</li>
              <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
            </ul>
            <p>Please approve or reject the request using the buttons below:</p>
            <div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/requests/${requestId}/approve" class="button approve">Approve</a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/requests/${requestId}/reject" class="button reject">Reject</a>
            </div>
            <p>If you need more details, please reply with your questions.</p>
          </body>
          </html>
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
