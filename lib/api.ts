// BlogPro API Service
// 连接到 Cloudflare Worker API

const API_BASE = 'https://blogpro-api.blog-api.workers.dev';

// 获取管理员密码（从 localStorage）
export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('blogpro_admin_password')
}

// 设置管理员密码
export function setAdminPassword(password: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('blogpro_admin_password', password)
}

// 清除管理员密码
export function clearAdminPassword(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('blogpro_admin_password')
}

// 检查是否已设置密码
export function hasAdminPassword(): boolean {
  return !!getAdminPassword()
}

// 通用 API 请求
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const password = getAdminPassword()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(password && { 'Authorization': `Bearer ${password}` }),
    ...options.headers,
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}

// ============ 笔记 API ============

export const notesApi = {
  getAll: () => apiRequest<any[]>('/api/notes'),
  
  create: (data: { title: string; content: string; tags?: string[]; slug?: string; readingTime?: number }) => 
    apiRequest<any>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<{ title: string; content: string; tags: string[]; slug: string; readingTime: number }>) =>
    apiRequest<any>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    }),
}

// ============ 网站分组 API ============

export const groupsApi = {
  getAll: () => apiRequest<any[]>('/api/groups'),
  
  create: (data: { name: string; icon?: string }) =>
    apiRequest<any>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<{ name: string; icon: string; orderIndex: number }>) =>
    apiRequest<any>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/groups/${id}`, {
      method: 'DELETE',
    }),
}

// ============ 网站 API ============

export const sitesApi = {
  getAll: () => apiRequest<any[]>('/api/sites'),
  
  create: (data: { name: string; url: string; description?: string; groupId?: string }) =>
    apiRequest<any>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<{ name: string; url: string; description: string; groupId: string; orderIndex: number }>) =>
    apiRequest<any>(`/api/sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/sites/${id}`, {
      method: 'DELETE',
    }),
}

// ============ 设置 API ============

export const settingsApi = {
  getAll: () => apiRequest<Record<string, any>>('/api/settings'),
  
  update: (key: string, value: any) =>
    apiRequest<{ key: string; value: any }>(`/api/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  
  // 批量更新设置
  updateMultiple: async (settings: Record<string, any>, password: string) => {
    const results = []
    for (const [key, value] of Object.entries(settings)) {
      try {
        const result = await settingsApi.update(key, value)
        results.push(result)
      } catch (error) {
        console.error(`Failed to update setting ${key}:`, error)
      }
    }
    return results
  },
}

// ============ 数据导出/导入 ============

export interface ExportData {
  version: string
  exportedAt: string
  notes: any[]
  sites: any[]
  groups: any[]
  settings: Record<string, any>
}

export const dataApi = {
  // 导出所有数据
  exportAll: async (): Promise<ExportData> => {
    const [notes, sites, groups, settings] = await Promise.all([
      notesApi.getAll(),
      sitesApi.getAll(),
      groupsApi.getAll(),
      settingsApi.getAll(),
    ])
    
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      sites,
      groups,
      settings,
    }
  },
  
  // 导入数据（需要密码验证）
  importAll: async (data: ExportData, password: string): Promise<void> => {
    // 导入分组
    for (const group of data.groups || []) {
      try {
        await groupsApi.create({ name: group.name, icon: group.icon })
      } catch (e) {
        // 可能已存在，跳过
      }
    }
    
    // 导入网站
    for (const site of data.sites || []) {
      try {
        await sitesApi.create({
          name: site.name,
          url: site.url,
          description: site.description,
          groupId: site.groupId,
        })
      } catch (e) {
        // 可能已存在，跳过
      }
    }
    
    // 导入笔记
    for (const note of data.notes || []) {
      try {
        await notesApi.create({
          title: note.title,
          content: note.content,
          tags: typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags,
          slug: note.slug,
          readingTime: note.readingTime,
        })
      } catch (e) {
        // 可能已存在，跳过
      }
    }
    
    // 导入设置
    for (const [key, value] of Object.entries(data.settings || {})) {
      try {
        await settingsApi.update(key, value)
      } catch (e) {
        // 可能已存在，跳过
      }
    }
  },
}

// 测试 API 连接
export async function testApiConnection(): Promise<boolean> {
  try {
    await apiRequest<any[]>('/api/notes')
    return true
  } catch {
    return false
  }
}

// 测试管理员权限
export async function testAdminPassword(password: string): Promise<boolean> {
  try {
    // 尝试创建一个测试笔记然后删除
    const testNote = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`,
      },
      body: JSON.stringify({
        title: '__test__',
        content: '__test__',
      }),
    })
    
    if (testNote.ok) {
      const note = await testNote.json()
      // 删除测试笔记
      await fetch(`${API_BASE}/api/notes/${note.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      })
      return true
    }
    return false
  } catch {
    return false
  }
}
