import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { users } from './users.js';
import { sql } from 'drizzle-orm';

export const posts = mysqlTable('posts', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  authorId: int('author_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  imageUrl: varchar('image_url', { length: 500 }),
  status: mysqlEnum('status', ['published', 'archived']).default('published'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});