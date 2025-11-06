import { generateHTML } from '@tiptap/html'
import { StarterKit } from '@tiptap/starter-kit'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import csharp from 'highlight.js/lib/languages/csharp'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'

const lowlight = createLowlight(common)
lowlight.register('csharp', csharp)
lowlight.register('cs', csharp)
lowlight.register('typescript', typescript)
lowlight.register('ts', typescript)
lowlight.register('javascript', javascript)
lowlight.register('js', javascript)
lowlight.register('sql', sql)

export function generateBlogHtmlFromJsonString(json: string): string {
  let doc: any
  try {
    doc = json ? JSON.parse(json) : null
  } catch {
    doc = null
  }
  if (!doc) return ''
  return generateHTML(doc, [
    StarterKit.configure({ horizontalRule: false, codeBlock: false }),
    CodeBlockLowlight.configure({ lowlight }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
  ])
}


