import { IDataAdapter } from '../types';
import { AlphaVantageAdapter } from './AlphaVantageAdapter';
import { FmpAdapter } from './FmpAdapter';
import { PolygonAdapter } from './PolygonIoAdapter';

export const availableAdapters: IDataAdapter[] = [
  new AlphaVantageAdapter(),
  new FmpAdapter(),
  new PolygonAdapter()
];

export function getAdapter(providerName: string): IDataAdapter | null {
  return availableAdapters.find(adapter => adapter.name === providerName) || null;
}
