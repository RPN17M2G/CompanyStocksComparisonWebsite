import { IDataAdapter } from '../shared/types/types';
import { AlphaVantageAdapter } from './AlphaVantageAdapter';
import { FmpAdapter } from './FmpAdapter';
import { PolygonAdapter } from './PolygonIoAdapter';
import { FinnhubAdapter } from './FinnhubAdapter';
import { IexCloudAdapter } from './IexCloudAdapter';
import { TwelveDataAdapter } from './TwelveDataAdapter';
import { NasdaqDataLinkAdapter } from './NasdaqDataLinkAdapter';

export const availableAdapters: IDataAdapter[] = [
  new AlphaVantageAdapter(),
  new FmpAdapter(),
  new PolygonAdapter(),
  new FinnhubAdapter(),
  new IexCloudAdapter(),
  new TwelveDataAdapter(),
  new NasdaqDataLinkAdapter(),
];

export function getAdapter(providerName: string): IDataAdapter | null {
  return availableAdapters.find(adapter => adapter.name === providerName) || null;
}
