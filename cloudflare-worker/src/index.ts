// Cloudflare Worker API for BlogPro

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

const ADMIN_PASSWORD = 'Xjh16639048747';

// 验证管理员密码
function verifyAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return false;
  }
  const token = auth.slice(7);
  return token === ADMIN_PASSWORD;
}

// 返回 JSON 响应
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// 返回错误响应
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// 笔记相关 API
async function handleNotes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // GET /api/notes - 获取所有笔记
  if (request.method === 'GET' && pathParts.length === 2) {
    const { results } = await env.DB.prepare('SELECT * FROM notes ORDER BY updatedAt DESC').all();
    return jsonResponse(results);
  }
  
  // POST /api/notes - 创建笔记
  if (request.method === 'POST' && pathParts.length === 2) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const body = await request.json();
    const { title, content, tags, slug, readingTime } = body;
    
    if (!title || !content) {
      return errorResponse('Title and content are required');
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO notes (id, title, content, tags, slug, readingTime, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, title, content, JSON.stringify(tags || []), slug || '', readingTime || 0, now, now).run();
    
    const note = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
    return jsonResponse(note, 201);
  }
  
  // PUT /api/notes/:id - 更新笔记
  if (request.method === 'PUT' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    const body = await request.json();
    const { title, content, tags, slug, readingTime } = body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (readingTime !== undefined) { updates.push('readingTime = ?'); values.push(readingTime); }
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    await env.DB.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    
    const note = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
    return jsonResponse(note);
  }
  
  // DELETE /api/notes/:id - 删除笔记
  if (request.method === 'DELETE' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }
  
  return errorResponse('Not found', 404);
}

// 网站分组相关 API
async function handleGroups(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // GET /api/groups - 获取所有分组
  if (request.method === 'GET' && pathParts.length === 2) {
    const { results } = await env.DB.prepare('SELECT * FROM site_groups ORDER BY orderIndex ASC').all();
    return jsonResponse(results);
  }
  
  // POST /api/groups - 创建分组
  if (request.method === 'POST' && pathParts.length === 2) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const body = await request.json();
    const { name, icon } = body;
    
    if (!name) {
      return errorResponse('Name is required');
    }
    
    const id = crypto.randomUUID();
    const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM site_groups').all();
    const orderIndex = (results[0] as any).count;
    
    await env.DB.prepare(`
      INSERT INTO site_groups (id, name, icon, orderIndex)
      VALUES (?, ?, ?, ?)
    `).bind(id, name, icon || '📁', orderIndex).run();
    
    const group = await env.DB.prepare('SELECT * FROM site_groups WHERE id = ?').bind(id).first();
    return jsonResponse(group, 201);
  }
  
  // PUT /api/groups/:id - 更新分组
  if (request.method === 'PUT' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    const body = await request.json();
    const { name, icon, orderIndex } = body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (orderIndex !== undefined) { updates.push('orderIndex = ?'); values.push(orderIndex); }
    values.push(id);
    
    if (updates.length > 0) {
      await env.DB.prepare(`UPDATE site_groups SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    
    const group = await env.DB.prepare('SELECT * FROM site_groups WHERE id = ?').bind(id).first();
    return jsonResponse(group);
  }
  
  // DELETE /api/groups/:id - 删除分组
  if (request.method === 'DELETE' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    await env.DB.prepare('DELETE FROM site_groups WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }
  
  return errorResponse('Not found', 404);
}

// 网站相关 API
async function handleSites(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // GET /api/sites - 获取所有网站
  if (request.method === 'GET' && pathParts.length === 2) {
    const { results } = await env.DB.prepare('SELECT * FROM sites ORDER BY orderIndex ASC').all();
    return jsonResponse(results);
  }
  
  // POST /api/sites - 创建网站
  if (request.method === 'POST' && pathParts.length === 2) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const body = await request.json();
    const { name, url: siteUrl, description, groupId } = body;
    
    if (!name || !siteUrl) {
      return errorResponse('Name and URL are required');
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM sites WHERE groupId = ?').bind(groupId || '').all();
    const orderIndex = (results[0] as any).count;
    
    await env.DB.prepare(`
      INSERT INTO sites (id, name, url, description, groupId, createdAt, orderIndex)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, siteUrl, description || '', groupId || '', now, orderIndex).run();
    
    const site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
    return jsonResponse(site, 201);
  }
  
  // PUT /api/sites/:id - 更新网站
  if (request.method === 'PUT' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    const body = await request.json();
    const { name, url: siteUrl, description, groupId, orderIndex } = body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (siteUrl !== undefined) { updates.push('url = ?'); values.push(siteUrl); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (groupId !== undefined) { updates.push('groupId = ?'); values.push(groupId); }
    if (orderIndex !== undefined) { updates.push('orderIndex = ?'); values.push(orderIndex); }
    values.push(id);
    
    if (updates.length > 0) {
      await env.DB.prepare(`UPDATE sites SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    }
    
    const site = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
    return jsonResponse(site);
  }
  
  // DELETE /api/sites/:id - 删除网站
  if (request.method === 'DELETE' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const id = pathParts[2];
    await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  }
  
  return errorResponse('Not found', 404);
}

// 设置相关 API
async function handleSettings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // GET /api/settings - 获取所有设置
  if (request.method === 'GET' && pathParts.length === 2) {
    const { results } = await env.DB.prepare('SELECT * FROM settings').all();
    const settings: Record<string, any> = {};
    for (const row of results) {
      const r = row as any;
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    // 从 KV 获取 heroBackground（可能很大，存 KV 不存 D1）
    const heroBackground = await env.KV.get('heroBackground');
    if (heroBackground) {
      settings.heroBackground = heroBackground;
    }
    return jsonResponse(settings);
  }
  
  // PUT /api/settings/:key - 更新设置
  if (request.method === 'PUT' && pathParts.length === 3) {
    if (!verifyAuth(request)) {
      return errorResponse('Unauthorized', 401);
    }
    const key = pathParts[2];
    const body = await request.json();
    const { value } = body;
    
    if (value === undefined) {
      return errorResponse('Value is required');
    }
    
    // heroBackground 存 KV（可能很大），不受 D1 1MB 限制
    if (key === 'heroBackground') {
      await env.KV.put('heroBackground', value);
      return jsonResponse({ key, value });
    }
    
    // 其他设置存 D1
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    await env.DB.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind(key, valueStr).run();
    
    return jsonResponse({ key, value });
  }
  
  return errorResponse('Not found', 404);
}

// 验证 KV 中存储的密码
async function verifyPassword(request: Request, env: Env): Promise<boolean> {
  const password = await env.KV.get('admin_password');
  if (password) {
    return password === ADMIN_PASSWORD;
  }
  return true; // 如果 KV 中没有设置密码，使用默认密码
}

// 主处理函数
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  // 路由处理
  if (path.startsWith('/api/notes')) {
    return handleNotes(request, env);
  }
  if (path.startsWith('/api/groups')) {
    return handleGroups(request, env);
  }
  if (path.startsWith('/api/sites')) {
    return handleSites(request, env);
  }
  if (path.startsWith('/api/settings')) {
    return handleSettings(request, env);
  }
  
  // 健康检查
  if (path === '/health') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  return errorResponse('Not found', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Error:', error);
      return errorResponse('Internal server error', 500);
    }
  },
};
