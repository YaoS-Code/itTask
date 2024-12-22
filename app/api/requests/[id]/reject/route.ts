/* eslint-disable @typescript-eslint/no-explicit-any */
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { NextRequest } from 'next/server';

interface RequestDetails {
  id: number;
  requester_name: string;
  requester_email: string;
  request_type: string;
  requested_date: string;
  notes: string;
  status: string;
}

export async function GET(request: NextRequest, context: any) {
  const id = context.params.id; // Directly access `context.params.id`

  try {
    // Update the status in the database
    db.prepare(`UPDATE requests SET status = 'Rejected' WHERE id = ?`).run(id);

    // Fetch request details
    const requestDetails = db
      .prepare(`SELECT * FROM requests WHERE id = ?`)
      .get(id) as RequestDetails;

    // Send email notification
    await sendEmail(
      requestDetails.requester_email,
      'Your data request has been rejected',
      `
        <p>Dear ${requestDetails.requester_name},</p>
        <p>Unfortunately, your data request has been <strong>rejected</strong>.</p>
        <ul>
          <li><strong>Request Type:</strong> ${requestDetails.request_type}</li>
          <li><strong>Preferred Data Retrieval Date:</strong> ${requestDetails.requested_date}</li>
          <li><strong>Notes:</strong> ${requestDetails.notes || 'No notes provided'}</li>
        </ul>
        <p>Thank you!</p>
        <p>MMC Wellness IT Team</p>
      `
    );
    await sendEmail(
      'it@mmcwellness.ca',
      'Data Request Rejected',
      `Request ${id} has been rejected.`
    );

    return new Response(`<p>Request ${id} has been rejected, and an email notification has been sent.</p>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
