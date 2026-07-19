/**
 * affiliate-widget.js — Widget nổi "Giới thiệu & Thưởng" (vanilla JS, không
 * cần React) cho Game Portal bao-ve-co-the. Port từ
 * GameAffiliateRewardWidget.jsx + phần bắt link giới thiệu / PORTAL_GAME_RESULT
 * của BodyProtectionJourneyPanel.jsx (repo ai-doctor-admin), gộp lại thành 1
 * module dùng thẳng bằng <script type="module">.
 *
 * Cách dùng (đã có sẵn trong index.html, xem cuối file <body>):
 *
 *   <script>window.AFFILIATE_CONFIG = { ... }</script>   (tuỳ chọn, xem affiliate-config.example.js)
 *   <script type="module">
 *     import { initAffiliate } from './affiliate/affiliate-widget.js'
 *     const affiliate = await initAffiliate()
 *     // Khi nhận postMessage PORTAL_GAME_RESULT từ iframe game:
 *     affiliate.notifyGameResult(data) // data = { gameId, gameTitle, status, score, timeSec, meta }
 *   </script>
 */

import {
  getOrCreateReferralCode,
  getReferralFor,
  resolveReferrerByCode,
  saveReferral,
  getReferralsByReferrer,
  recordGameProgress,
  getRewards,
  getPendingRewards,
  addRewardWithReferralCommission,
  markRewardSynced,
  markRewardFailed,
} from './affiliate-db.js'
import { registerReferralOnChain, recordRewardOnChain, retryPendingRewards } from './affiliate-chain.js'

const DEVICE_UUID_KEY = 'gamePortalDeviceUuid_v1'

// Thưởng "xem quảng cáo" giả lập (giây) khi chưa gắn SDK Google Ads Rewarded
// thật. Thay hàm handleWatchAd bên dưới bằng lệnh gọi SDK thật (vd Google Ad
// Manager rewarded ad / AdMob rewarded ad web) khi có ad unit chính thức.
const AD_WATCH_SECONDS = 15
const AD_REWARD = { amount: 5000, currency: 'VIET' }
const GAME_COMPLETE_REWARD = { amount: 2000, currency: 'VIET' }

// ─── Danh tính thiết bị (không cần đăng nhập) ──────────────────────────────
// bao-ve-co-the không có hệ thống tài khoản, nên "uuid" ở đây là 1 định danh
// ẩn danh gắn với trình duyệt/thiết bị hiện tại, sinh 1 lần và giữ ổn định
// trong localStorage — dùng làm khoá cho referral code, ví ẩn danh on-chain,
// tiến trình chơi game và sổ cái thưởng.
export function getOrCreateDeviceUuid() {
  let uuid = localStorage.getItem(DEVICE_UUID_KEY)
  if (!uuid) {
    uuid = (window.crypto?.randomUUID?.() ||
      'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2))
    localStorage.setItem(DEVICE_UUID_KEY, uuid)
  }
  return uuid
}

// ─── Bắt mã giới thiệu ?ref=CODE trên URL (đúng 1 lần / thiết bị) ─────────
async function captureReferralFromUrl(uuid) {
  const params = new URLSearchParams(window.location.search)
  const refCode = params.get('ref')
  if (!refCode) return
  const already = await getReferralFor(uuid)
  if (already) return
  const referrerUuid = await resolveReferrerByCode(refCode)
  if (!referrerUuid || referrerUuid === uuid) return
  const saved = await saveReferral({ referrerUuid, refereeUuid: uuid, code: refCode, source: 'games' })
  if (saved?.id) {
    registerReferralOnChain({ id: saved.id, referrerUuid, refereeUuid: uuid }).catch((err) =>
      console.warn('[affiliate-widget] Không thể ghi referral lên chain ngay, sẽ thử lại sau:', err)
    )
  }
}

// Ghi 1 khoản thưởng cho `uuid` + hoa hồng local cho tuyến trên (nếu có), rồi
// gửi ĐÚNG 1 giao dịch rewardTask() lên chain — vì contract đã tự chia hoa
// hồng ngược lên toàn bộ tuyến trên trong CÙNG giao dịch đó.
async function submitReward({ uuid, kind, amount, currency, gameId, note }) {
  const { primaryId, commissionId } = await addRewardWithReferralCommission({
    uuid, kind, amount, currency, gameId, note,
  })
  const result = await recordRewardOnChain({ id: primaryId, uuid, amount })
  if (commissionId) {
    if (result.ok) await markRewardSynced(commissionId, result.txHash)
    else await markRewardFailed(commissionId, result.cooldown ? 'Chưa đồng bộ — chờ giao dịch chính của người được giới thiệu.' : (result.error || 'Lỗi không xác định'))
  }
  return result
}

// ─── CSS (chèn 1 lần, dùng chung biến màu với index.html nếu có) ──────────
function ensureStyles() {
  if (document.getElementById('affiliate-widget-style')) return
  const style = document.createElement('style')
  style.id = 'affiliate-widget-style'
  style.textContent = `
    .aff-fab{
      position:fixed; right:20px; bottom:20px; z-index:9999;
      display:flex; align-items:center; gap:8px;
      padding:12px 18px; border:none; border-radius:999px; cursor:pointer;
      background:linear-gradient(90deg,var(--amber,#fbbf24),var(--rose,#fb7185));
      color:#1a0e08; font-weight:800; font-family:var(--font-body,sans-serif);
      font-size:14px; box-shadow:0 8px 24px rgba(251,113,133,.35);
      transition:transform .15s ease;
    }
    .aff-fab:hover{ transform:translateY(-2px); }
    .aff-panel{
      position:fixed; right:20px; bottom:20px; z-index:9999; width:320px; max-width:92vw;
      background:var(--panel-solid,#0d1424); border:1px solid var(--border,#1c2740);
      border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.55);
      font-family:var(--font-body,sans-serif); color:var(--text,#e7ecf6);
    }
    .aff-head{
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 14px; background:linear-gradient(90deg,rgba(251,191,36,.18),rgba(251,113,133,.18));
      border-bottom:1px solid var(--border,#1c2740);
    }
    .aff-head b{ font-size:14px; }
    .aff-close{ background:none; border:none; color:var(--text-dim,#8ea0bd); font-size:16px; cursor:pointer; }
    .aff-close:hover{ color:var(--text,#e7ecf6); }
    .aff-body{ padding:14px; display:flex; flex-direction:column; gap:12px; max-height:70vh; overflow-y:auto; }
    .aff-label{ font-size:11px; color:var(--text-dim,#8ea0bd); margin-bottom:4px; }
    .aff-linkrow{ display:flex; gap:6px; align-items:center; background:rgba(0,0,0,.35); border:1px solid var(--border,#1c2740); border-radius:10px; padding:7px 9px; }
    .aff-linkrow input{ flex:1; min-width:0; background:transparent; border:none; color:var(--text,#e7ecf6); font-size:11px; outline:none; }
    .aff-copybtn{ flex-shrink:0; border:none; border-radius:8px; background:rgba(255,255,255,.1); color:var(--text,#e7ecf6); padding:6px 8px; cursor:pointer; font-size:11px; }
    .aff-copybtn:hover{ background:rgba(255,255,255,.2); }
    .aff-statrow{ display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,.3); border:1px solid var(--border,#1c2740); border-radius:10px; padding:8px 10px; font-size:13px; }
    .aff-adbtn{ width:100%; border:none; border-radius:10px; padding:11px; font-weight:800; font-size:13px; cursor:pointer; color:#04140d; background:var(--emerald,#10b981); }
    .aff-adbtn:disabled{ opacity:.6; cursor:default; }
    .aff-adbtn:hover:not(:disabled){ filter:brightness(1.08); }
    .aff-histhead{ display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--text-dim,#8ea0bd); }
    .aff-refresh{ background:none; border:none; color:var(--text-dim,#8ea0bd); cursor:pointer; font-size:13px; }
    .aff-refresh:hover{ color:var(--text,#e7ecf6); }
    .aff-histlist{ display:flex; flex-direction:column; gap:6px; max-height:150px; overflow-y:auto; }
    .aff-histempty{ text-align:center; font-size:11px; color:var(--text-faint,#516079); border:1px dashed var(--border,#1c2740); border-radius:8px; padding:10px; }
    .aff-histrow{ display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,.3); border-radius:8px; padding:6px 9px; font-size:11px; gap:6px; }
    .aff-histrow .note{ color:var(--text-dim,#8ea0bd); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .aff-histright{ display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .aff-amount{ color:var(--emerald,#10b981); font-weight:800; }
    .aff-badge{ border-radius:5px; padding:2px 5px; font-size:9px; font-weight:800; }
    .aff-badge.synced{ background:rgba(16,185,129,.2); color:var(--emerald,#10b981); }
    .aff-badge.failed{ background:rgba(251,113,133,.2); color:var(--rose,#fb7185); }
    .aff-badge.pending{ background:rgba(251,191,36,.2); color:var(--amber,#fbbf24); }
  `
  document.head.appendChild(style)
}

function fmtNum(n) { return Number(n || 0).toLocaleString('vi-VN') }

// ─── Widget chính ──────────────────────────────────────────────────────────
export async function initAffiliate(opts = {}) {
  const uuid = opts.uuid || getOrCreateDeviceUuid()
  ensureStyles()

  // 1) Bắt referral từ URL (nếu có ?ref=)
  await captureReferralFromUrl(uuid)

  // 2) Đồng bộ lại các reward đang "pending" (vd sau khi mất mạng lần trước)
  getPendingRewards().then((rows) => {
    const mine = rows.filter(r => r.uuid === uuid)
    if (mine.length) retryPendingRewards(mine).catch(() => {})
  }).catch(() => {})

  // 3) Render UI
  const root = document.createElement('div')
  document.body.appendChild(root)

  let open = false
  let watchingAd = false
  let adSecondsLeft = 0
  let claiming = false
  let adTimer = null

  const fab = document.createElement('button')
  fab.className = 'aff-fab'
  fab.type = 'button'
  fab.innerHTML = '🎁 Giới thiệu &amp; Thưởng'
  fab.addEventListener('click', () => { open = true; render() })

  const panel = document.createElement('div')
  panel.className = 'aff-panel'

  function renderShell() {
    root.innerHTML = ''
    root.appendChild(open ? panel : fab)
  }

  async function refreshData() {
    const [code, refs, rewards] = await Promise.all([
      getOrCreateReferralCode(uuid),
      getReferralsByReferrer(uuid),
      getRewards(uuid),
    ])
    return { code, referralCount: refs.length, rewards: rewards.slice(0, 8) }
  }

  async function render() {
    renderShell()
    if (!open) return
    const { code, referralCount, rewards } = await refreshData()
    const referralLink = code
      ? `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(code)}`
      : ''

    panel.innerHTML = `
      <div class="aff-head">
        <b>🎁 Affiliate Game</b>
        <button type="button" class="aff-close" data-act="close">✕</button>
      </div>
      <div class="aff-body">
        <div>
          <div class="aff-label">Link giới thiệu của bạn</div>
          <div class="aff-linkrow">
            <input readonly value="${referralLink}">
            <button type="button" class="aff-copybtn" data-act="copy">Copy</button>
          </div>
        </div>
        <div class="aff-statrow">
          <span>👥 Đã giới thiệu</span>
          <b>${referralCount} người</b>
        </div>
        <button type="button" class="aff-adbtn" data-act="watchad" ${watchingAd || claiming ? 'disabled' : ''}>
          ${watchingAd ? `Đang xem quảng cáo… ${adSecondsLeft}s` : claiming ? 'Đang ghi nhận thưởng…' : '▶ Xem quảng cáo nhận thưởng'}
        </button>
        <div>
          <div class="aff-histhead">
            <span>🏆 Lịch sử thưởng gần đây</span>
            <button type="button" class="aff-refresh" data-act="refresh">⟳</button>
          </div>
          <div class="aff-histlist">
            ${rewards.length === 0 ? '<div class="aff-histempty">Chưa có thưởng nào.</div>' : rewards.map(r => `
              <div class="aff-histrow">
                <span class="note">${escapeHtml(r.note || r.kind)}</span>
                <span class="aff-histright">
                  <b class="aff-amount">+${fmtNum(r.amount)} ${escapeHtml(r.currency)}</b>
                  <span class="aff-badge ${r.chainStatus}" title="${escapeHtml(r.chainStatus === 'synced' ? (r.txHash || '') : r.chainStatus === 'failed' ? (r.error || '') : '')}">
                    ${r.chainStatus === 'synced' ? 'On-chain' : r.chainStatus === 'failed' ? 'Lỗi' : 'Đang gửi'}
                  </span>
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
    panel.querySelector('[data-act="close"]').addEventListener('click', () => { open = false; render() })
    panel.querySelector('[data-act="refresh"]').addEventListener('click', () => render())
    panel.querySelector('[data-act="copy"]').addEventListener('click', async (e) => {
      try {
        await navigator.clipboard.writeText(referralLink)
        e.target.textContent = 'Đã chép!'
        setTimeout(() => { e.target.textContent = 'Copy' }, 2000)
      } catch { /* ignore */ }
    })
    const adBtn = panel.querySelector('[data-act="watchad"]')
    if (adBtn) adBtn.addEventListener('click', handleWatchAd)
  }

  function escapeHtml(s) {
    const d = document.createElement('div')
    d.textContent = String(s == null ? '' : s)
    return d.innerHTML
  }

  function handleWatchAd() {
    if (watchingAd || claiming) return
    watchingAd = true
    adSecondsLeft = AD_WATCH_SECONDS
    render()
    tickAd()
  }

  function tickAd() {
    clearTimeout(adTimer)
    adTimer = setTimeout(async () => {
      adSecondsLeft -= 1
      if (adSecondsLeft > 0) { render(); tickAd(); return }
      watchingAd = false
      claiming = true
      render()
      await submitReward({
        uuid, kind: 'ad_watch', amount: AD_REWARD.amount, currency: AD_REWARD.currency,
        gameId: 'ad_watch', note: 'Xem quảng cáo nhận thưởng',
      })
      claiming = false
      render()
    }, 1000)
  }

  renderShell()

  // ─── API công khai: gọi khi nhận PORTAL_GAME_RESULT từ iframe game ───────
  async function notifyGameResult(data) {
    if (!data || typeof data !== 'object') return
    await recordGameProgress({
      uuid,
      gameId: data.gameId,
      gameTitle: data.gameTitle,
      status: data.status,
      score: data.score,
      timeSec: data.timeSec,
      meta: data.meta,
    }).catch(() => {})

    if (data.status === 'win' || data.status === 'freeplay') {
      await submitReward({
        uuid,
        kind: 'game_complete',
        amount: GAME_COMPLETE_REWARD.amount,
        currency: GAME_COMPLETE_REWARD.currency,
        gameId: data.gameId,
        note: `Hoàn thành ${data.gameTitle || data.gameId}`,
      })
    }
    if (open) render()
  }

  return { uuid, notifyGameResult, refresh: render }
}
