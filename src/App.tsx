import React, { useState } from 'react'
import { QuizHero } from '@/components/QuizHero'
import { AgeStageSelector } from '@/components/AgeStageSelector'
import { HealthFocusSelector } from '@/components/HealthFocusSelector'
import { SingleChoiceStep } from '@/components/SingleChoiceStep'
import { SymptomsStep } from '@/components/SymptomsStep'
import { ResultsLandingPage } from '@/components/ResultsLandingPage'
import { ResearchPaperPage } from '@/components/ResearchPaperPage'
import { AgeBand, LifeStage, validateCombo } from '@/utils/guardrails'
import { mapSymptomsToKeys } from '@/utils/symptoms'
import { getStrainLevel } from '@/utils/strain'
import DownloadModal from '@/components/ui/DownloadModal'

type Screen = 'hero' | 'age' | 'focus' | 'energy' | 'sleep' | 'stress' | 'symptoms' | 'results' | 'research'

interface UserState {
  age?: AgeBand
  stage?: LifeStage
  preferences?: string[]
  energy?: string
  sleep?: string
  stress?: string
  symptoms?: string[]
}

function calcStrainLevel(energy?: string, sleep?: string, stress?: string) {
  return getStrainLevel(energy, sleep, stress)
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('hero')
  const [user, setUser] = useState<UserState>({})
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'in-progress' | 'success' | 'failed'>('idle')
  const [downloadMessage, setDownloadMessage] = useState<string | undefined>(undefined)
  function handleStart() {
    setScreen('age')
  }

  function handleStartOver() {
    setUser({})
    setScreen('hero')
  }

  async function handleDownload() {
    try {
      setDownloadStatus('in-progress')
      const el = document.getElementById('snapshot-root')
      if (!el) {
        setDownloadStatus('failed')
        setDownloadMessage('Nothing to download right now.')
        return
      }

      // Clone the element and inline computed styles to resolve modern color functions
      function cloneWithInlineStyles(source: HTMLElement) {
        const clone = source.cloneNode(true) as HTMLElement

        const srcElements = Array.from(source.querySelectorAll('*')) as HTMLElement[]
        const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[]

        // include root element as first
        const srcAll = [source, ...srcElements]
        const cloneAll = [clone, ...cloneElements]

        for (let i = 0; i < srcAll.length; i++) {
          const s = srcAll[i]
          const c = cloneAll[i]
          const computed = window.getComputedStyle(s)
          let cssText = ''
          for (let j = 0; j < computed.length; j++) {
            const prop = computed[j]
            try {
              const val = computed.getPropertyValue(prop)
              cssText += `${prop}:${val};`
            } catch (e) {
              // ignore single property failures
            }
          }
          c.setAttribute('style', cssText)
        }

        return clone
      }

      const cloned = cloneWithInlineStyles(el as HTMLElement)

      // Render offscreen to avoid layout shifts. Use scrollWidth/Height to capture full content.
      const wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-9999px'
      wrapper.style.top = '0'
      wrapper.style.width = cloned.scrollWidth + 'px'
      wrapper.style.height = cloned.scrollHeight + 'px'
      wrapper.appendChild(cloned)
      document.body.appendChild(wrapper)

      function trimCanvasWhitespace(srcCanvas: HTMLCanvasElement) {
        const w = srcCanvas.width
        const h = srcCanvas.height
        const ctx = srcCanvas.getContext('2d')!
        const data = ctx.getImageData(0, 0, w, h).data

        let top = -1
        let bottom = -1
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            const a = data[idx + 3]
            // consider non-white or non-transparent pixels
            if (a > 10 && !(r > 250 && g > 250 && b > 250)) {
              top = y
              break
            }
          }
          if (top !== -1) break
        }
        for (let y = h - 1; y >= 0; y--) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            const a = data[idx + 3]
            if (a > 10 && !(r > 250 && g > 250 && b > 250)) {
              bottom = y
              break
            }
          }
          if (bottom !== -1) break
        }

        if (top === -1 || bottom === -1 || bottom <= top) return srcCanvas

        const trimmed = document.createElement('canvas')
        trimmed.width = w
        trimmed.height = bottom - top + 1
        const tctx = trimmed.getContext('2d')!
        tctx.drawImage(srcCanvas, 0, top, w, trimmed.height, 0, 0, w, trimmed.height)
        return trimmed
      }

      // Load libs via Promise chain (avoid `await import()` parsing issues)
      import('html2canvas')
        .then(hc => import('jspdf').then(j => ({ hc: hc.default, jspdf: j })))
        .then(async ({ hc, jspdf }) => {
          const html2canvas = hc
          const { jsPDF } = jspdf
          // Increase scale for better readability
          const scale = 4
          const canvas = await html2canvas(cloned as HTMLElement, { scale, useCORS: true, width: cloned.scrollWidth, height: cloned.scrollHeight })
          // trim whitespace from canvas
          const trimmed = trimCanvasWhitespace(canvas)
          // remove wrapper asap
          try { if (document.body.contains(wrapper)) document.body.removeChild(wrapper) } catch (e) {}

          const imgData = trimmed.toDataURL('image/png')

          const imgProps = { width: trimmed.width, height: trimmed.height }

          // decide PDF sizing after knowing image dimensions
          const A4_WIDTH_MM = 210
          let pdf: any
          let pdfWidth: number
          let pdfHeight: number
          // temporary estimate for pageHeightPx when using A4; will be corrected for single-page custom height below
          const estimatedPdfHeight = 297
          const pageHeightPx = Math.floor((trimmed.width * estimatedPdfHeight) / A4_WIDTH_MM)
          let actualPageSlicePx = pageHeightPx

          if (imgProps.height <= pageHeightPx) {
            // single-page snapshot: create PDF sized to content + footer to trim whitespace
            const imageHeightMM = (imgProps.height * A4_WIDTH_MM) / imgProps.width
            const footerGapMM = 8
            const footerHeightMM = 12
            const customPdfHeight = Math.max( imageHeightMM + footerGapMM + footerHeightMM, 50 )
            pdf = new (jsPDF as any)('p', 'mm', [A4_WIDTH_MM, customPdfHeight])
            pdfWidth = A4_WIDTH_MM
            pdfHeight = customPdfHeight
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imageHeightMM)
          } else {
            // multi-page: use A4
            pdf = new (jsPDF as any)('p', 'mm', 'a4')
            pdfWidth = pdf.internal.pageSize.getWidth()
            pdfHeight = pdf.internal.pageSize.getHeight()
            const pageHeightPxReal = Math.floor((trimmed.width * pdfHeight) / pdfWidth)
            actualPageSlicePx = pageHeightPxReal
            let position = 0
            const totalHeight = imgProps.height
            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = trimmed.width
            pageCanvas.height = pageHeightPxReal
            const pageCtx = pageCanvas.getContext('2d')

            while (position < totalHeight) {
              pageCtx!.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
              pageCtx!.drawImage(trimmed, 0, position, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height)
              const pageData = pageCanvas.toDataURL('image/png')
              if (position === 0) {
                pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
              } else {
                pdf.addPage()
                pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
              }
              position += actualPageSlicePx
            }
          }

          // place a two-line centered footer just below the snapshot content on the last page
          try {
            const pageCount = (pdf.getNumberOfPages && pdf.getNumberOfPages()) || 1
            let lastContentHeightMM = 0
            const footerGapMM = 8
            if (imgProps.height <= pageHeightPx) {
              // single-page: rendered image height in mm
              lastContentHeightMM = (imgProps.height * pdfWidth) / imgProps.width
            } else {
              // multi-page: compute remaining pixels on the last slice
              const totalHeight = imgProps.height
              const remainder = totalHeight % actualPageSlicePx
              const lastSlicePx = remainder === 0 ? actualPageSlicePx : remainder
              // each slice maps to full pdfHeight mm, so scale accordingly
              lastContentHeightMM = (lastSlicePx * pdfHeight) / actualPageSlicePx
            }

            const line1 = 'website: www.blissmi.health'
            const line2 = 'contact: hello@myblissmi.com'
            const x = pdfWidth / 2
            const maxY = pdfHeight - 6
            let y1 = Math.min(lastContentHeightMM + footerGapMM, maxY - 5)
            if (y1 < 12) y1 = 12
            const y2 = y1 + 5

            pdf.setPage(pageCount)
            pdf.setFontSize(10)
            pdf.setTextColor(100)
            ;(pdf as any).text(line1, x, y1, { align: 'center' })
            ;(pdf as any).text(line2, x, y2, { align: 'center' })
          } catch (e) {
            console.warn('Failed to add footer to PDF', e)
          }

          pdf.save('blissmi-snapshot.pdf')
          setDownloadStatus('success')
        })
        .catch(async (err: any) => {
          // try a secondary capture using dom-to-image-more
          try {
            const domtoimage = (await import('dom-to-image-more')).default
            const scale = 4
            const pngData = await domtoimage.toPng(cloned, {
              width: cloned.scrollWidth * scale,
              height: cloned.scrollHeight * scale,
              style: {
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              },
            })
            // remove wrapper
            try {
              if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
            } catch (e) {}

            // load image to get dimensions
            const { jsPDF } = await import('jspdf')
            await new Promise<void>((resolve, reject) => {
              const img = new Image()
              img.onload = () => {
                const imgProps = { width: img.width, height: img.height }
                // decide PDF sizing
                const A4_WIDTH_MM = 210
                let pdf: any
                let pdfWidth: number
                let pdfHeight: number
                const pageHeightPxForA4 = Math.floor((imgProps.width * 297) / A4_WIDTH_MM)

                if (imgProps.height <= pageHeightPxForA4) {
                  const imageHeightMM = (imgProps.height * A4_WIDTH_MM) / imgProps.width
                  const footerGapMM = 8
                  const footerHeightMM = 12
                  const customPdfHeight = Math.max(imageHeightMM + footerGapMM + footerHeightMM, 50)
                  pdf = new (jsPDF as any)('p', 'mm', [A4_WIDTH_MM, customPdfHeight])
                  pdfWidth = A4_WIDTH_MM
                  pdfHeight = customPdfHeight
                  pdf.addImage(pngData, 'PNG', 0, 0, pdfWidth, imageHeightMM)
                  try {
                    const pageCount = (pdf.getNumberOfPages && pdf.getNumberOfPages()) || 1
                    const line1 = 'website: www.blissmi.health'
                    const line2 = 'contact: hello@myblissmi.com'
                    const x = pdfWidth / 2
                    const maxY = pdfHeight - 6
                    let y1 = Math.min(imageHeightMM + footerGapMM, maxY - 5)
                    if (y1 < 12) y1 = 12
                    const y2 = y1 + 5
                    pdf.setPage(pageCount)
                    pdf.setFontSize(10)
                    pdf.setTextColor(100)
                    ;(pdf as any).text(line1, x, y1, { align: 'center' })
                    ;(pdf as any).text(line2, x, y2, { align: 'center' })
                  } catch (e) { console.warn('Failed to add footer to PDF', e) }
                  pdf.save('blissmi-snapshot.pdf')
                  setDownloadStatus('success')
                  resolve()
                } else {
                  // split into pages using canvas
                  // create A4 PDF for multi-page
                  pdf = new (jsPDF as any)('p', 'mm', 'a4')
                  pdfWidth = pdf.internal.pageSize.getWidth()
                  pdfHeight = pdf.internal.pageSize.getHeight()

                  const tmpCanvas = document.createElement('canvas')
                  tmpCanvas.width = img.width
                  tmpCanvas.height = img.height
                  const tmpCtx = tmpCanvas.getContext('2d')!
                  tmpCtx.drawImage(img, 0, 0)

                  // Trim bottom/blank whitespace from the tmp canvas
                  const trimmedTmp = trimCanvasWhitespace(tmpCanvas)

                  const pageSlicePx = Math.floor((trimmedTmp.width * pdfHeight) / pdfWidth)

                  const pageCanvas = document.createElement('canvas')
                  pageCanvas.width = trimmedTmp.width
                  pageCanvas.height = pageSlicePx
                  const pageCtx = pageCanvas.getContext('2d')
                  let position = 0
                  const totalHeight = trimmedTmp.height

                  while (position < totalHeight) {
                    pageCtx!.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
                    pageCtx!.drawImage(trimmedTmp, 0, position, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height)
                    const pageData = pageCanvas.toDataURL('image/png')
                    if (position === 0) {
                      pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                    } else {
                      pdf.addPage()
                      pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                    }
                    position += pageSlicePx
                  }
                  try {
                    const pageCount = (pdf.getNumberOfPages && pdf.getNumberOfPages()) || 1
                    const remainder = trimmedTmp.height % pageSlicePx
                    const lastSlicePx = remainder === 0 ? pageSlicePx : remainder
                    const lastContentHeightMM = (lastSlicePx * pdfHeight) / pageSlicePx
                    const footerGapMM = 8
                    const line1 = 'website: www.blissmi.health'
                    const line2 = 'contact: hello@myblissmi.com'
                    const x = pdfWidth / 2
                    const maxY = pdfHeight - 6
                    let y1 = Math.min(lastContentHeightMM + footerGapMM, maxY - 5)
                    if (y1 < 12) y1 = 12
                    const y2 = y1 + 5
                    pdf.setPage(pageCount)
                    pdf.setFontSize(10)
                    pdf.setTextColor(100)
                    ;(pdf as any).text(line1, x, y1, { align: 'center' })
                    ;(pdf as any).text(line2, x, y2, { align: 'center' })
                  } catch (e) { console.warn('Failed to add footer to PDF', e) }
                  pdf.save('blissmi-snapshot.pdf')
                  setDownloadStatus('success')
                  resolve()
                }
              }
              img.onerror = () => reject(new Error('Failed loading PNG from dom-to-image'))
              img.src = pngData
            })
          } catch (err2) {
            try {
              if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
            } catch (e) {}
            setDownloadStatus('failed')
            setDownloadMessage(err2 && err2.message ? String(err2.message) : String(err2))
            throw err2
          }
        })
    } catch (err: any) {
      console.error('Failed to generate PDF', err)
      const msg = err && err.message ? String(err.message) : String(err)
      setDownloadStatus('failed')
      setDownloadMessage(msg)
    }
  }

  function openPrintView() {
    try {
      const el = document.getElementById('snapshot-root')
      if (!el) return
      const clone = el.cloneNode(true) as HTMLElement

      // copy stylesheets
      const head = document.querySelector('head')
      let styles = ''
      if (head) {
        head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
          styles += node.outerHTML
        })
      }

      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Snapshot</title>${styles}</head><body></body></html>`)
      win.document.body.style.margin = '0'
      win.document.body.appendChild(clone)
      setTimeout(() => {
        try {
          win.focus()
          win.print()
        } catch (e) {
          console.error('Print view failed', e)
        }
      }, 700)
    } catch (e) {
      console.error('Open print view failed', e)
    }
  }

  return (
    <div>
      <DownloadModal
        status={downloadStatus}
        message={downloadMessage}
        onClose={() => { setDownloadStatus('idle'); setDownloadMessage(undefined) }}
        onOpenPrint={openPrintView}
      />
      {screen === 'hero' && <QuizHero onStart={handleStart} />}
      {screen === 'age' && (
        <AgeStageSelector
          onStartOver={handleStartOver}
          onComplete={(age, stage) => {
            const result = validateCombo(age, stage)
            if (!result.valid) {
              const corrected = result.corrected ?? stage
              // notify user about the auto-correction and apply it
              alert(`Selected life stage adjusted to "${corrected}" to match your age range.`)
              setUser({ age, stage: corrected })
            } else {
              setUser({ age, stage })
            }
            // advance to step 3: health focus selector
            setScreen('focus')
          }}
        />
      )}

      {screen === 'focus' && (
        <HealthFocusSelector
          stage={user.stage}
          onStartOver={handleStartOver}
          onComplete={selected => {
            setUser(u => ({ ...u, preferences: selected }))
            setScreen('energy')
          }}
        />
      )}

      {screen === 'energy' && (
        <SingleChoiceStep
          question="How is your energy most days?"
          options={['High and steady', 'I crash in the afternoon', 'I feel tired most days', 'I feel wired but exhausted']}
          currentStep={4}
          totalSteps={7}
          onStartOver={handleStartOver}
          onSelect={value => {
            setUser(u => ({ ...u, energy: value }))
            setScreen('sleep')
          }}
        />
      )}

      {screen === 'sleep' && (
        <SingleChoiceStep
          question="How is your sleep?"
          options={['7–8 hours, good quality', '6–7 hours, light sleep', 'Less than 6 hours', 'I wake up often']}
          currentStep={5}
          totalSteps={7}
          strainLevel={calcStrainLevel(user.energy, undefined, undefined)}
          onStartOver={handleStartOver}
          onSelect={value => {
            setUser(u => ({ ...u, sleep: value }))
            setScreen('stress')
          }}
        />
      )}

      {screen === 'stress' && (
        <SingleChoiceStep
          question="How stressed do you feel right now?"
          options={['Low', 'Moderate', 'High', 'Constantly overwhelmed']}
          currentStep={6}
          totalSteps={7}
          strainLevel={calcStrainLevel(user.energy, user.sleep, undefined)}
          onStartOver={handleStartOver}
          onSelect={value => {
            setUser(u => ({ ...u, stress: value }))
            setScreen('symptoms')
          }}
        />
      )}

      {screen === 'symptoms' && (
        <SymptomsStep
          strainLevel={calcStrainLevel(user.energy, user.sleep, user.stress)}
          onStartOver={handleStartOver}
          onComplete={symptoms => {
            // Normalize symptoms to keys before storing
            const keys = mapSymptomsToKeys(symptoms)
            setUser(u => ({ ...u, symptoms: keys }))
            setScreen('results')
          }}
        />
      )}

      {screen === 'results' && (
        <ResultsLandingPage
          answers={{
            ageRange: user.age ?? '',
            lifeStage: user.stage ?? '',
            healthFocus: user.preferences ?? [],
            energy: user.energy ?? '',
            sleep: user.sleep ?? '',
            stress: user.stress ?? '',
            symptoms: user.symptoms ?? [],
          }}
          onUnlock={() => setScreen('research')}
          onDownload={handleDownload}
          onStartOver={handleStartOver}
        />
      )}
      {screen === 'research' && (
        <ResearchPaperPage onBack={() => setScreen('results')} onStartOver={handleStartOver} />
      )}
    </div>
  )
}
