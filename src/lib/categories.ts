/**
 * Provides build-time access to category records from the SQLite database.
 *
 * These helpers are used by Astro pages to read and shape static data without
 * introducing a separate backend layer.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';

/**
 * Retrieves every category from the database in alphabetical order by name.
 *
 * @param db - Injectable database handle used to read category records.
 * @returns A list of categories sorted by their display name.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    const rows = await db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
    }));
}
