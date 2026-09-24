import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('filters games by category', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'strategy' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'puzzle' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Alpha Games', description: 'alpha' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Alpha Strategy Game', description: 'A1', starRating: 4.1, categoryId: strategy.id, publisherId: publisher.id },
            { title: 'Alpha Puzzle Game', description: 'A2', starRating: 4.2, categoryId: puzzle.id, publisherId: publisher.id },
        ]);

        const filtered = await getAllGames(db, { categoryId: strategy.id });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Strategy Game']);
        expect(filtered.every((game) => game.category?.name === 'Strategy')).toBe(true);
    });

    it('filters games by publisher when a publisher is selected', async () => {
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [alpha] = await db
            .insert(publishers)
            .values({ name: 'Alpha Games', description: 'alpha' })
            .returning({ id: publishers.id });
        const [beta] = await db
            .insert(publishers)
            .values({ name: 'Beta Games', description: 'beta' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Alpha Game 01', description: 'A1', starRating: 4.1, categoryId: category.id, publisherId: alpha.id },
            { title: 'Alpha Game 02', description: 'A2', starRating: 4.2, categoryId: category.id, publisherId: alpha.id },
            { title: 'Beta Game 01', description: 'B1', starRating: 4.3, categoryId: category.id, publisherId: beta.id },
        ]);

        const filtered = await getAllGames(db, { publisherId: alpha.id });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Game 01', 'Alpha Game 02']);
        expect(filtered.every((game) => game.publisher?.name === 'Alpha Games')).toBe(true);
    });

    it('combines category and publisher filters', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'strategy' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'puzzle' })
            .returning({ id: categories.id });
        const [alpha] = await db
            .insert(publishers)
            .values({ name: 'Alpha Games', description: 'alpha' })
            .returning({ id: publishers.id });
        const [beta] = await db
            .insert(publishers)
            .values({ name: 'Beta Games', description: 'beta' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Alpha Strategy Game', description: 'A1', starRating: 4.1, categoryId: strategy.id, publisherId: alpha.id },
            { title: 'Alpha Puzzle Game', description: 'A2', starRating: 4.2, categoryId: puzzle.id, publisherId: alpha.id },
            { title: 'Beta Strategy Game', description: 'B1', starRating: 4.3, categoryId: strategy.id, publisherId: beta.id },
        ]);

        const filtered = await getAllGames(db, { categoryId: strategy.id, publisherId: alpha.id });

        expect(filtered.map((game) => game.title)).toEqual(['Alpha Strategy Game']);
        expect(filtered.every((game) => game.category?.name === 'Strategy' && game.publisher?.name === 'Alpha Games')).toBe(true);
    });

    it('returns an empty list when a filter has no matching games', async () => {
        await seedGames(db, 2);

        const filtered = await getAllGames(db, { publisherId: 99999, categoryId: 99999 });

        expect(filtered).toEqual([]);
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
