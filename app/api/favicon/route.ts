import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    // 确保 URL 有协议
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(fullUrl)
    const hostname = urlObj.hostname

    // 尝试获取 favicon.ico
    const faviconUrl = `https://${hostname}/favicon.ico`

    try {
      const response = await fetch(faviconUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/x-icon'
        
        return new NextResponse(Buffer.from(base64, 'base64'), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400, s-maxage=604800'
          }
        })
      }
    } catch (e) {
      // favicon.ico 获取失败，尝试其他方式
    }

    // 尝试从 HTML 中获取 favicon
    try {
      const htmlResponse = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (htmlResponse.ok) {
        const html = await htmlResponse.text()
        
        // 查找 favicon link 标签
        const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
        if (faviconMatch && faviconMatch[1]) {
          let faviconHref = faviconMatch[1]
          
          // 处理相对路径
          if (faviconHref.startsWith('//')) {
            faviconHref = 'https:' + faviconHref
          } else if (faviconHref.startsWith('/')) {
            faviconHref = `https://${hostname}${faviconHref}`
          } else if (!faviconHref.startsWith('http')) {
            faviconHref = `https://${hostname}/${faviconHref}`
          }

          // 获取这个 favicon
          const iconResponse = await fetch(faviconHref, {
            signal: AbortSignal.timeout(5000)
          })

          if (iconResponse.ok) {
            const arrayBuffer = await iconResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString('base64')
            const contentType = iconResponse.headers.get('content-type') || 'image/png'
            
            return new NextResponse(Buffer.from(base64, 'base64'), {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=604800'
              }
            })
          }
        }
      }
    } catch (e) {
      // HTML 获取失败
    }

    // 如果都失败了，返回一个默认的 SVG 图标
    const defaultIcon = createDefaultIcon(hostname)
    return new NextResponse(defaultIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800'
      }
    })

  } catch (error) {
    // 返回默认图标
    const defaultIcon = createDefaultIcon('?')
    return new NextResponse(defaultIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800'
      }
    })
  }
}

function createDefaultIcon(initial: string): string {
  const firstChar = initial.charAt(0).toUpperCase() || '?'
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="12" fill="#6366f1"/>
    <text x="32" y="44" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${firstChar}</text>
  </svg>`
}
