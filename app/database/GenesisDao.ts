import { genesisTable } from '../constants/databaseNames.json';
import { Genesis } from './types';

export default async function getGenesis(): Promise<Genesis> {
    return window.database.general.selectFirst(genesisTable);
}
