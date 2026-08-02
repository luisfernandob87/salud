import EntityListPage from '../components/EntityListPage';
import { Pill } from 'lucide-react';

export default function Medications() {
  return (
    <EntityListPage
      type="medication"
      title="Medicamentos"
      subtitle="Los que tomas, tomaste o suspendiste."
      endpoint="/api/medications"
      emptyTitle="Aún no registras medicamentos"
      emptyDescription="Lleva el control de dosis, fechas y quién los indicó."
    />
  );
}
