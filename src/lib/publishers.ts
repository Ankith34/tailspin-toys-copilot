/**
 * Provides build-time access to publisher records from the SQLite database.
 *
 * These helpers are used by Astro pages to read and shape static data without
 * introducing a separate backend layer.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Retrieves every publisher from the database in alphabetical order by name.
 *
 * @param db - Injectable database handle used to read publisher records.
 * @returns A list of publishers sorted by their display name.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    const rows = await db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
