import EntityListPage from '../components/EntityListPage';
import { FileText } from 'lucide-react';

export default function Studies() {
  return (
    <EntityListPage
      type="study"
      title="Estudios"
      subtitle="Radiografías, laboratorios, resonancias y más."
      endpoint="/api/studies"
      emptyTitle="Aún no tienes estudios"
      emptyDescription="Guarda tus exámenes e imágenes para no perderlos nunca."
    />
  );
}
