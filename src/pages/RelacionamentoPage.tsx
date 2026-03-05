import { DashboardLayout } from '@/components/DashboardLayout';
import { RelacionamentoDashboard } from '@/components/dashboard/RelacionamentoDashboard';

export default function RelacionamentoPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <RelacionamentoDashboard />
      </div>
    </DashboardLayout>
  );
}
