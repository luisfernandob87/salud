import EntityListPage from '../components/EntityListPage';
import { Stethoscope } from 'lucide-react';

export default function Appointments() {
  return (
    <EntityListPage
      type="consultation"
      title="Consultas"
      subtitle="Tus consultas médicas y sus diagnósticos."
      endpoint="/api/consultations"
      emptyTitle="Aún no registras consultas"
      emptyDescription="Guarda especialidad, doctor, motivo y diagnóstico de cada consulta."
    />
  );
}
