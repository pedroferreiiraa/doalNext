import CardWrapper from '@/app/ui/dashboard/cards';

import RevenueChart from '@/app/ui/dashboard/revenue-chart';
// import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
 
export default async function Page() {

  return (
    <main>
      <h1 className="font-medium text-gray-900 pb-1 px-3">
      </h1>
      <Suspense  fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      <div className="mt-6 ">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          {/* <LatestInvoices /> */}
        </Suspense>
      </div>
    </main>
  );
}