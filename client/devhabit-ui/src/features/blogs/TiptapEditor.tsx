"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { common, createLowlight } from 'lowlight'
import csharp from 'highlight.js/lib/languages/csharp'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
// import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

interface TiptapEditorProps {
  content: string;
  // eslint-disable-next-line no-unused-vars
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  editor,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  editor: Editor | null
}) => {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const rerender = () => setTick((x) => x + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          type="button"
          data-style="ghost"
          aria-label="Image 25% width"
          tooltip="Image width 25%"
          disabled={!editor?.isActive('image')}
          onClick={() => editor?.chain().focus().updateAttributes('image', { width: '25%', height: undefined }).run()}
        >
          25%
        </Button>
        <Button
          type="button"
          data-style="ghost"
          aria-label="Image 50% width"
          tooltip="Image width 50%"
          disabled={!editor?.isActive('image')}
          onClick={() => editor?.chain().focus().updateAttributes('image', { width: '50%', height: undefined }).run()}
        >
          50%
        </Button>
        <Button
          type="button"
          data-style="ghost"
          aria-label="Image 75% width"
          tooltip="Image width 75%"
          disabled={!editor?.isActive('image')}
          onClick={() => editor?.chain().focus().updateAttributes('image', { width: '75%', height: undefined }).run()}
        >
          75%
        </Button>
        <Button
          type="button"
          data-style="ghost"
          aria-label="Image 100% width"
          tooltip="Image width 100%"
          disabled={!editor?.isActive('image')}
          onClick={() => editor?.chain().focus().updateAttributes('image', { width: '100%', height: undefined }).run()}
        >
          100%
        </Button>
        <Button
          type="button"
          data-style="ghost"
          aria-label="Reset image size"
          tooltip="Reset image size"
          disabled={!editor?.isActive('image')}
          onClick={() => editor?.chain().focus().updateAttributes('image', { width: undefined, height: undefined }).run()}
        >
          Reset
        </Button>
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, editable = true, className = '' }) => {
  const lowlight = useMemo(() => {
    const ll = createLowlight(common)
    ll.register('csharp', csharp)
    ll.register('typescript', typescript)
    ll.register('javascript', javascript)
    ll.register('sql', sql)
    return ll
  }, [])
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [pickerPos, setPickerPos] = useState<{visible: boolean; top: number; left: number}>({ visible: false, top: 0, left: 0 })

  // Safely parse JSON content to avoid runtime crashes on invalid JSON
  const initialEditorContent = useMemo(() => {
    if (!content) return ""
    try {
      return JSON.parse(content)
    } catch {
      return ""
    }
  }, [content])

  const editor = useEditor({
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: 'hljs' },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialEditorContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  })

  const languageOptions = useMemo(
    () => [
      { value: 'csharp', label: 'C#' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'javascript', label: 'JavaScript' },
      { value: 'sql', label: 'SQL' },
      { value: 'json', label: 'JSON' },
      { value: 'bash', label: 'Bash' },
    ],
    []
  )

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Position language picker over the active code block
  useEffect(() => {
    const updatePicker = () => {
      if (!editor || !wrapperRef.current) { setPickerPos(p => ({ ...p, visible: false })); return }
      if (!editor.isActive('codeBlock')) { setPickerPos(p => ({ ...p, visible: false })); return }
      const sel = document.getSelection();
      const anchor = sel?.anchorNode as Node | null
      const element = (anchor instanceof Element ? anchor : anchor?.parentElement) as HTMLElement | null
      const pre = element ? (element.closest('pre') as HTMLElement | null) : null
      if (!pre) { setPickerPos(p => ({ ...p, visible: false })); return }
      const preRect = pre.getBoundingClientRect()
      const wrapRect = wrapperRef.current.getBoundingClientRect()
      setPickerPos({ visible: true, top: preRect.top - wrapRect.top + 8, left: preRect.right - wrapRect.left - 160 })
    }

    document.addEventListener('selectionchange', updatePicker)
    editor?.on('transaction', updatePicker)
    return () => {
      document.removeEventListener('selectionchange', updatePicker)
      editor?.off('transaction', updatePicker)
    }
  }, [editor])

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  if (!editor) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div ref={wrapperRef} className={`blog-editor-wrapper ${className}`} style={{ position: 'relative' }}>
      <EditorContext.Provider value={{ editor }}>
        {editable && (
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
                editor={editor}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}

            <div style={{ marginLeft: 8 }}>
              <select
                aria-label="Code language"
                disabled={!editor?.isActive('codeBlock')}
                value={(editor?.getAttributes('codeBlock')?.language as string) || ''}
                onChange={(e) =>
                  editor
                    ?.chain()
                    .focus()
                    .updateAttributes('codeBlock', { language: e.target.value })
                    .run()
                }
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  opacity: editor?.isActive('codeBlock') ? 1 : 0.5,
                }}
              >
                <option value="">Plain Text</option>
                {languageOptions.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </Toolbar>
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="blog-editor-content"
        />

        {pickerPos.visible && (
          <div style={{ position: 'absolute', top: pickerPos.top, left: pickerPos.left, zIndex: 20 }}>
            <select
              aria-label="Code language"
              value={(editor.getAttributes('codeBlock')?.language as string) || ''}
              onChange={(e) => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
            >
              <option value="">Plain Text</option>
              {languageOptions.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        )}
      </EditorContext.Provider>
    </div>
  )
}
