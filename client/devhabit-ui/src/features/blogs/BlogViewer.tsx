import DOMPurify from 'dompurify'
import React from 'react'
import '../../styles/viewer.css'
import 'highlight.js/styles/atom-one-dark.css'
import hljs from 'highlight.js/lib/core'
import csharp from 'highlight.js/lib/languages/csharp'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'

hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('sql', sql)

export default function BlogViewer({ html }: { html: string }) {
  const safe = React.useMemo(
    () =>
      DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['class', 'data-language'],
        ADD_TAGS: ['span'],
      }),
    [html]
  )
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const codes = root.querySelectorAll('pre code')
    codes.forEach((el) => {
      if (!el.classList.contains('hljs')) {
        el.classList.add('hljs')
      }
      // Ensure the parent <pre> also has .hljs so the theme can target it directly
      const pre = el.parentElement
      if (pre && pre.tagName.toLowerCase() === 'pre' && !pre.classList.contains('hljs')) {
        pre.classList.add('hljs')
      }
      const dataLang = (el.getAttribute('data-language') || '').trim()
      if (dataLang) {
        const langClass = `language-${dataLang}`
        if (!el.classList.contains(langClass)) {
          el.classList.add(langClass)
        }
      }
      const hasTokens = el.querySelector('[class^="hljs-"]') || el.querySelector('span[class*="hljs-"]')
      if (!hasTokens) {
        try {
          hljs.highlightElement(el as HTMLElement)
        } catch {}
      }
    })
  }, [safe])
  return (
    <div className="prose prose-lg max-w-none w-full" ref={containerRef}>
      <div dangerouslySetInnerHTML={{ __html: safe }} />
    </div>
  )
}


