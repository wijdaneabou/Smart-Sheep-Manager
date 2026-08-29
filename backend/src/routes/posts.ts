import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import { posts, users } from "../db/schema/index.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import fs from "fs";
import path from "path";

// Define user type for context
type UserContext = {
  id: number;
  roleId: number;
  roleName: string | null;
};

const postsRouter = new Hono();

// ========== GET /posts – List all published posts (pagination) ==========
postsRouter.get("/", isAuthenticated, async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 10;
  const offset = (page - 1) * limit;

  // Fetch posts with author details
  const postsList = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorPhoto: users.photo,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  // Format response
  const formattedPosts = postsList.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    imageUrl: p.imageUrl,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    author: {
      id: p.authorId,
      firstName: p.authorFirstName,
      lastName: p.authorLastName,
      photo: p.authorPhoto,
    },
  }));

  // Total count for pagination
  const totalResult = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.status, "published"));
  const total = totalResult[0]?.count || 0;

  return c.json({
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ========== POST /posts – Create a new post (Admin only, roleId=1) ==========
postsRouter.post("/", isAuthenticated, async (c) => {
  const user = (c as any).var?.user as UserContext | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (user.roleId !== 1) {
    return c.json({ error: "Only Super Admin can create posts" }, 403);
  }

  // Parse form data
  const body = await c.req.parseBody();
  const title = body.title?.toString() || null;
  const content = body.content?.toString();
  const status = body.status?.toString() || "published";

  if (!content) {
    return c.json({ error: "Content is required" }, 400);
  }

  // Handle image upload
  let imageUrl: string | null = null;
  const formData = await c.req.formData();
  const file = formData.get("image") as File | null;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.name.split('.').pop() || 'jpg';
    const fullFilename = `${filename}.${ext}`;

    const uploadDir = path.join(process.cwd(), "uploads", "postsImages");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fullFilename);
    fs.writeFileSync(filePath, buffer);
    imageUrl = `/uploads/postsImages/${fullFilename}`;
  }

  // Insert post
  let postId: number;
  try {
    const result = await db
      .insert(posts)
      .values({
        title,
        content,
        authorId: user.id,
        imageUrl,
        status: status as "published" | "archived",
      })
      .$returningId();
    postId = result[0].id;
  } catch {
    const [insertResult] = await db
      .insert(posts)
      .values({
        title,
        content,
        authorId: user.id,
        imageUrl,
        status: status as "published" | "archived",
      });
    postId = insertResult.insertId;
  }

  // Fetch created post with author details
  const [created] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorPhoto: users.photo,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, postId));

  return c.json(
    {
      id: created.id,
      title: created.title,
      content: created.content,
      imageUrl: created.imageUrl,
      status: created.status,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      author: {
        id: created.authorId,
        firstName: created.authorFirstName,
        lastName: created.authorLastName,
        photo: created.authorPhoto,
      },
    },
    201
  );
});

// ========== PUT /posts/:id – Update a post (Admin only) ==========
postsRouter.put("/:id", isAuthenticated, async (c) => {
  const user = (c as any).var?.user as UserContext | undefined;
  if (!user || user.roleId !== 1) {
    return c.json({ error: "Only Super Admin can update posts" }, 403);
  }

  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const { title, content } = body;

  // Check if post exists
  const existing = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing.length) {
    return c.json({ error: "Post not found" }, 404);
  }

  // Update only title and content (keep image unchanged)
  await db
    .update(posts)
    .set({
      title: title !== undefined ? title : existing[0].title,
      content: content !== undefined ? content : existing[0].content,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(posts.id, id));

  // Fetch updated post
  const [updated] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorPhoto: users.photo,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id));

  return c.json({
    id: updated.id,
    title: updated.title,
    content: updated.content,
    imageUrl: updated.imageUrl,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    author: {
      id: updated.authorId,
      firstName: updated.authorFirstName,
      lastName: updated.authorLastName,
      photo: updated.authorPhoto,
    },
  });
});

// ========== DELETE /posts/:id – Delete a post (Admin only) ==========
postsRouter.delete("/:id", isAuthenticated, async (c) => {
  const user = (c as any).var?.user as UserContext | undefined;
  if (!user || user.roleId !== 1) {
    return c.json({ error: "Only Super Admin can delete posts" }, 403);
  }

  const id = Number(c.req.param("id"));

  const existing = await db.select().from(posts).where(eq(posts.id, id));
  if (!existing.length) {
    return c.json({ error: "Post not found" }, 404);
  }

  await db.delete(posts).where(eq(posts.id, id));
  return c.json({ success: true, message: "Post deleted successfully" });
});

export default postsRouter;