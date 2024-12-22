"use client";

import React, { useState, useRef, useEffect } from 'react';

interface PastRequest {
  id: number;
  requester_name: string;
  requester_email: string;
  request_type: string;
  requested_date: string;
  notes: string;
  status: string;
}

interface ClientPageProps {
  pastRequests: PastRequest[];
}

export default function ClientPage({ pastRequests: initialRequests }: ClientPageProps) {
  const [pastRequests, setPastRequests] = useState<PastRequest[]>(initialRequests);
  const formRef = useRef<HTMLFormElement>(null);
  const [requestType, setRequestType] = useState('');
  const [authorized_by, setAuthorizedBy] = useState('');
  const [authorized_email, setAuthorizedEmail] = useState('');

  useEffect(() => {
    if (requestType) {
      const [name, email] = requestType.split(':');
      setAuthorizedBy(name);
      setAuthorizedEmail(email);
    }
  }, [requestType]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(formRef.current!);

    const payload = {
      requester_name: formData.get('requesterName') as string,
      requester_email: formData.get('requesterEmail') as string,
      request_type: formData.get('requestType') as string,
      requested_date: formData.get('requestedDate') as string,
      notes: formData.get('notes') as string,
    };

    console.log('Submitting payload:', payload);

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newRequest = await res.json();
      setPastRequests((prev) => [
        {
          id: newRequest.id,
          ...payload,
          status: 'Pending',
        },
        ...prev,
      ]);

      formRef.current!.reset(); // Reset the form
      alert('Request submitted successfully! The page will refresh to show past requests.');
      window.location.reload(); // Refresh the page
    } else {
      console.error('Failed to submit:', await res.text());
    }
  }

  return (
    <main className="p-8 space-y-12">
      {/* Section 1: Form */}
      <section className="bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Request Data from MMC Wellness</h1>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 flex flex-col">
            <label htmlFor="requesterName" className="font-medium mb-1">
              Requester Name（请输入您的姓名）
            </label>
            <input
              type="text"
              name="requesterName"
              id="requesterName"
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="col-span-1 flex flex-col">
            <label htmlFor="requesterEmail" className="font-medium mb-1">
              Requester Email（请输入您的邮箱）
            </label>
            <input
              type="email"
              name="requesterEmail"
              id="requesterEmail"
              required
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="col-span-1 flex flex-col">
            <label htmlFor="requestType" className="font-medium mb-1">
              Type of Data（请选择对应诊所，如果是敏感数据，请选择CEO）
            </label>
            <select
              name="requestType"
              id="requestType"
              required
              className="border border-gray-300 rounded px-3 py-2"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
            >
              <option value="">Please select the type of data</option>
              <option value="Susanna:it@mmcwellness.ca">CEO-Susanna</option>
              <option value="Serena:it@mmcwellness.ca">RAAC-Serena</option>
              <option value="Eva:it@mmcwellness.ca">MMC-Eva</option>
              <option value="Jacinda:it@mmcwellness.ca">SkinartMD-Jacinda</option>
            </select>
          </div>
          <input type="hidden" name="authorized_by" id="authorized_by" value={authorized_by} />
          <input type="hidden" name="authorized_email" id="authorized_email" value={authorized_email} />
          <div className="col-span-1 flex flex-col">
            <label htmlFor="requestedDate" className="font-medium mb-1">
              Preferred Data Retrieval Date（请选择您希望获取数据的时间）
            </label>
            <input
              type="date"
              name="requestedDate"
              id="requestedDate"
              required
              className="border border-gray-300 rounded px-3 py-2"
              min={new Date().toISOString().split('T')[0]}
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="col-span-2 flex flex-col">
            <label htmlFor="notes" className="font-medium mb-1">
              Notes / Additional Reasons（请输入您希望获取的具体内容）
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={4}
              className="border border-gray-300 rounded px-3 py-2"
            ></textarea>
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white font-medium px-5 py-2 rounded hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Past Requests */}
      <section className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-bold mb-4">Past Requests</h2>
        <div className="overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left p-3">Requester</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Preferred Date</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pastRequests.map((req) => (
                <tr key={req.id} className="border-b border-gray-200">
                  <td className="p-3">{req.requester_name}</td>
                  <td className="p-3">{req.requester_email}</td>
                  <td className="p-3">{req.request_type}</td>
                  <td className="p-3">{req.requested_date}</td>
                  <td className="p-3">
                    <span className="font-medium text-yellow-600">{req.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
