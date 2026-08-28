const weddingDate = new Date('2030-10-01T11:58:00+08:00')
document.querySelector('#days-count').textContent = String(Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / 86400000)))

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const revealElements = document.querySelectorAll('.reveal')
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    revealObserver.unobserve(entry.target)
  }), { threshold: 0.12, rootMargin: '0px 0px -4% 0px' })
  revealElements.forEach((element) => revealObserver.observe(element))
} else revealElements.forEach((element) => element.classList.add('is-visible'))

const bubbleField = document.querySelector('.bubble-field')
for (let index = 0; index < 28; index += 1) {
  const bubble = document.createElement('i')
  bubble.style.left = `${(index * 37 + 9) % 97}%`
  bubble.style.setProperty('--duration', `${6 + (index % 6) * 1.1}s`)
  bubble.style.setProperty('--delay', `${-(index % 9) * 1.15}s`)
  bubbleField.append(bubble)
}

const hud = document.querySelector('.game-hud')
const depthValue = document.querySelector('#depth-value')
const oxygenFill = document.querySelector('#oxygen-fill')
const musicHint = document.querySelector('#music-hint')
let ticking = false
function updateHud() {
  const progress = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))
  hud.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.55)
  depthValue.textContent = String(Math.round(progress * 420))
  oxygenFill.style.transform = `scaleX(${1 - progress * 0.22})`
  if (window.scrollY > 20) musicHint.classList.add('is-hidden')
  ticking = false
}
window.addEventListener('scroll', () => { if (!ticking) requestAnimationFrame(updateHud); ticking = true }, { passive: true })

const missionCard = document.querySelector('.mission-card')
const acceptButton = document.querySelector('#accept-quest')
const questStatus = document.querySelector('#quest-status')
const missionComplete = document.querySelector('#mission-complete')
let holdTimer
function startHold() {
  if (missionCard.classList.contains('is-accepted')) return
  missionCard.classList.add('is-holding')
  holdTimer = window.setTimeout(() => {
    missionCard.classList.remove('is-holding')
    missionCard.classList.add('is-accepted')
    questStatus.textContent = 'ACCEPTED'
    acceptButton.textContent = '委托已接受 ✓'
    missionComplete.classList.remove('show')
    requestAnimationFrame(() => missionComplete.classList.add('show'))
    navigator.vibrate?.([45, 30, 80])
  }, 1000)
}
function cancelHold() { window.clearTimeout(holdTimer); missionCard.classList.remove('is-holding') }
acceptButton.addEventListener('pointerdown', startHold)
acceptButton.addEventListener('pointerup', cancelHold)
acceptButton.addEventListener('pointerleave', cancelHold)
acceptButton.addEventListener('pointercancel', cancelHold)
acceptButton.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') startHold() })
acceptButton.addEventListener('keyup', cancelHold)

const sonarField = document.querySelector('.sonar-field')
document.querySelector('#sonar-button').addEventListener('click', () => {
  const ring = document.createElement('i')
  sonarField.append(ring)
  window.setTimeout(() => ring.remove(), 1100)
  document.querySelectorAll('.pixel-fish:not(.caught)').forEach((fish) => fish.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.4) drop-shadow(0 0 8px #fff)' }, { filter: 'brightness(1)' }], { duration: 700 }))
  navigator.vibrate?.(35)
})

const fishField = document.querySelector('#fish-field')
const fishCount = document.querySelector('#fish-count')
const fishColors = ['#ffbd45', '#ff6474', '#82e7de', '#b0ef4d', '#f88ed8']
const fishBlessings = ['祝您暴富', '祝您永远不死', '祝您美若天仙（已经是了）', '祝您发东南西北旋风财', '祝您早日实现财富自由']
let caught = 0
function showFishBlessing(fish) {
  if (Math.random() > 0.72) return
  const blessing = document.createElement('p')
  const fishRect = fish.getBoundingClientRect()
  const fieldRect = fishField.getBoundingClientRect()
  blessing.className = 'fish-blessing'
  blessing.textContent = fishBlessings[Math.floor(Math.random() * fishBlessings.length)]
  blessing.style.left = `${Math.max(4, Math.min(fieldRect.width - 164, fishRect.left - fieldRect.left - 48))}px`
  blessing.style.top = `${Math.max(4, fishRect.top - fieldRect.top - 42)}px`
  fishField.appendChild(blessing)
  window.setTimeout(() => blessing.remove(), 2400)
}
for (let index = 0; index < 9; index += 1) {
  const fish = document.createElement('button')
  fish.type = 'button'; fish.className = 'pixel-fish'; fish.setAttribute('aria-label', `捕捉第 ${index + 1} 条鱼`)
  fish.style.top = `${12 + (index * 37) % 135}px`
  fish.style.setProperty('--swim', `${6.5 + (index % 4) * 1.2}s`)
  fish.style.setProperty('--fish', fishColors[index % fishColors.length])
  fish.style.animationDelay = `${-(index * 1.3)}s`
  fish.addEventListener('click', () => {
    if (fish.classList.contains('caught')) return
    fish.classList.add('caught'); caught = Math.min(5, caught + 1); fishCount.textContent = String(caught); navigator.vibrate?.(25); showFishBlessing(fish)
    if (caught === 5) {
      const message = document.createElement('p'); message.className = 'fish-unlock'; message.textContent = '祝福图鉴已完成：幸福值 +1000'; fishField.append(message)
    }
  })
  fishField.append(fish)
}

const crewSlides = [...document.querySelectorAll('.crew-slide')]
const crewName = document.querySelector('#crew-name')
let crewIndex = 0
function showCrew(nextIndex) {
  crewIndex = (nextIndex + crewSlides.length) % crewSlides.length
  crewSlides.forEach((slide, index) => slide.classList.toggle('is-active', index === crewIndex))
  crewName.textContent = `${crewSlides[crewIndex].dataset.name} · ${crewIndex + 1}/${crewSlides.length}`
}
document.querySelector('[data-crew="prev"]').addEventListener('click', () => showCrew(crewIndex - 1))
document.querySelector('[data-crew="next"]').addEventListener('click', () => showCrew(crewIndex + 1))

const musicToggle = document.querySelector('#music-toggle')
const officialBgm = document.querySelector('#official-bgm')
let musicPlaying = false
function setMusicState(playing) {
  musicPlaying = playing; musicToggle.classList.toggle('playing', playing); musicToggle.setAttribute('aria-pressed', String(playing)); musicToggle.setAttribute('aria-label', playing ? '暂停官方背景音乐' : '播放官方背景音乐')
}
async function playMusic() {
  musicHint.classList.add('is-hidden')
  try {
    officialBgm.volume = 0.58
    await officialBgm.play()
    setMusicState(true)
  } catch {
    setMusicState(false)
  }
}
function pauseMusic() { officialBgm.pause(); setMusicState(false) }
musicToggle.addEventListener('click', () => musicPlaying ? pauseMusic() : playMusic())
document.querySelector('#start-mission').addEventListener('click', () => { playMusic(); document.querySelector('#briefing').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }) })

const rsvpForm = document.querySelector('#rsvp-form')
const accommodationDates = document.querySelector('#accommodation-dates')
const accommodationField = document.querySelector('#accommodation-field')
const messageField = rsvpForm.elements.message
const messageCount = document.querySelector('#message-count')
const rsvpError = document.querySelector('#rsvp-error')
const rsvpSuccess = document.querySelector('#rsvp-success')
const rsvpSuccessTitle = document.querySelector('#rsvp-success-title')
const rsvpSuccessSummary = document.querySelector('#rsvp-success-summary')
const rsvpSubmit = rsvpForm.querySelector('[type="submit"]')
const storageKey = 'dave-wedding-demo-rsvp'
let savedRsvp
try { savedRsvp = JSON.parse(localStorage.getItem(storageKey)) } catch { savedRsvp = undefined }
function updateAccommodation() {
  const needed = rsvpForm.elements.needsAccommodation.value === 'yes'
  accommodationDates.hidden = !needed; rsvpForm.elements.checkInAt.required = needed; rsvpForm.elements.checkOutAt.required = needed
  if (needed) { rsvpForm.elements.checkInAt.value ||= '2030-09-30T14:00'; rsvpForm.elements.checkOutAt.value ||= '2030-10-01T12:00' }
}
function fillRsvp(data) {
  if (!data) return
  rsvpForm.elements.guestName.value = data.guestName || ''; rsvpForm.elements.partySize.value = String(data.partySize || 1); rsvpForm.elements.phone.value = data.phone || ''; rsvpForm.elements.message.value = data.message || ''
  const choice = rsvpForm.querySelector(`[name="needsAccommodation"][value="${data.needsAccommodation ? 'yes' : 'no'}"]`); if (choice) choice.checked = true
  rsvpForm.elements.checkInAt.value = data.checkInAt || '2030-09-30T14:00'; rsvpForm.elements.checkOutAt.value = data.checkOutAt || '2030-10-01T12:00'; messageCount.value = String(rsvpForm.elements.message.value.length); updateAccommodation()
}
function showRsvpError(message) { rsvpError.textContent = message; rsvpError.hidden = false }
function collectRsvp() {
  const formData = new FormData(rsvpForm); const guestName = String(formData.get('guestName') || '').trim(); const needsAccommodation = formData.get('needsAccommodation') === 'yes'; const checkInAt = String(formData.get('checkInAt') || ''); const checkOutAt = String(formData.get('checkOutAt') || '')
  if (!guestName) throw new Error('请填写宾客姓名。'); if (needsAccommodation && (!checkInAt || !checkOutAt)) throw new Error('请填写完整的住宿时间。'); if (needsAccommodation && checkOutAt <= checkInAt) throw new Error('退房时间必须晚于入住时间。')
  return { id: savedRsvp?.id, editToken: savedRsvp?.editToken, guestName, partySize: Number(formData.get('partySize')), needsAccommodation, checkInAt: needsAccommodation ? checkInAt : null, checkOutAt: needsAccommodation ? checkOutAt : null, phone: String(formData.get('phone') || '').trim(), message: String(formData.get('message') || '').trim() }
}
rsvpForm.addEventListener('change', (event) => { if (event.target.name === 'needsAccommodation') { accommodationField.removeAttribute('aria-invalid'); updateAccommodation() } })
messageField.addEventListener('input', () => { messageCount.value = String(messageField.value.length) })
rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault(); rsvpError.hidden = true
  let submission
  try { submission = collectRsvp() } catch (error) { showRsvpError(error.message); return }
  rsvpSubmit.disabled = true; rsvpSubmit.querySelector('span').textContent = '正在保存演示登记……'
  try {
    savedRsvp = { ...submission, id: 'demo-local-only', editToken: undefined }
    localStorage.setItem(storageKey, JSON.stringify(savedRsvp))
    rsvpForm.hidden = true; rsvpSuccess.hidden = false; rsvpSuccessTitle.textContent = `${submission.guestName}，演示登记成功`; rsvpSuccessSummary.textContent = `已在本机保存 ${submission.partySize} 人的演示记录${submission.needsAccommodation ? ' · 已登记住宿需求' : ' · 无需住宿'}；这些内容不会上传。`; rsvpSuccess.focus({ preventScroll: true })
  } catch (error) { showRsvpError(error.message || '网络开小差了，请稍后再试。') }
  finally { rsvpSubmit.disabled = false; rsvpSubmit.querySelector('span').textContent = '保存赴约信息' }
})
document.querySelector('#rsvp-edit').addEventListener('click', () => { fillRsvp(savedRsvp); rsvpForm.hidden = false; rsvpSuccess.hidden = true })
fillRsvp(savedRsvp)
