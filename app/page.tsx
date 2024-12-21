import ClientPage from './ClientPage';

export default async function Page() {
  // Fetch data dynamically from the API
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/requests`, { cache: 'no-store' });
  const pastRequests = await res.json();

  return <ClientPage pastRequests={pastRequests} />;
}
