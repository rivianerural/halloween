import PainelClient from './PainelClient';
import { EVENTOS } from '@/lib/eventos';

export const metadata = { title: 'Travessuras em aberto | erural' };

export default function Page() {
  return <PainelClient eventos={EVENTOS} />;
}
