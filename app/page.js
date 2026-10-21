import SorteioClient from './SorteioClient';
import { EVENTOS } from '@/lib/eventos';

export default function Page() {
  return <SorteioClient eventos={EVENTOS} />;
}
