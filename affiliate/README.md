# Affiliate cho Game Portal (bao-ve-co-the)

Hệ thống "Giới thiệu bạn bè cùng chơi & nhận thưởng" cho các game trong repo
này, tham khảo kiến trúc từ repo `ai-doctor-admin`
(`src/lib/gameAffiliateDB.js`, `src/lib/gameAffiliateChain.js`,
`src/components/GameAffiliateRewardWidget.jsx`,
`src/components/BodyProtectionJourneyPanel.jsx`) nhưng viết lại thành
**JavaScript thuần (ES module)**, không cần React/Vite, vì `bao-ve-co-the` là
tập hợp file HTML tĩnh.

## Cấu trúc

```
affiliate/
  affiliate-db.js               IndexedDB: mã giới thiệu, quan hệ referral,
                                 tiến trình chơi game, sổ cái thưởng
  affiliate-chain.js            Ghi referral + thưởng lên BSC Testnet
                                 (gasless qua Pimlico bundler + Paymaster)
  affiliate-widget.js           Widget nổi "Giới thiệu & Thưởng" (vanilla JS)
                                 + bắt link giới thiệu ?ref=... + nhận
                                 PORTAL_GAME_RESULT
  affiliate-config.example.js   Mẫu cấu hình (copy -> affiliate-config.js)
```

`index.html` (Game Portal) đã được nối dây sẵn:
- Nạp `window.AFFILIATE_CONFIG` (địa chỉ contract) rồi `initAffiliate()`.
- Trong listener `window.addEventListener('message', ...)` đã có sẵn để ghi
  Leader Board, có thêm 1 dòng gọi `aff.notifyGameResult(data)` mỗi khi 1 game
  gửi `PORTAL_GAME_RESULT` — dòng này lo phần Affiliate (ghi tiến trình +
  cộng thưởng + đồng bộ blockchain), độc lập với Leader Board local.

## Luồng hoạt động

1. **Sinh mã giới thiệu**: mỗi thiết bị/trình duyệt có 1 `uuid` ẩn danh
   (localStorage `gamePortalDeviceUuid_v1`, không cần đăng nhập). Mở widget
   "🎁 Giới thiệu & Thưởng" sẽ tự sinh mã dạng `GM-XXXXXX-YYY` và link:
   `.../index.html?ref=GM-XXXXXX-YYY`.
2. **Người được giới thiệu** click link đó → `affiliate-widget.js` đọc
   `?ref=`, tra `uuid` của người giới thiệu trong IndexedDB, lưu quan hệ vào
   store `referrals`, rồi gọi `registerReferralOnChain()` để ghi lên contract
   `HienMauAffiliate.sol` (gasless, không cần ví/gas thật).
3. **Chơi game xong**: mỗi file game (`bao-ve-co-the-*.html`,
   `human-*.html`, `co-the-*.html`, `gesture-*-demo*.html`) đã có sẵn khối
   `// ===== PORTAL BRIDGE (auto-injected) =====` ở cuối file, gọi
   `reportGameResult(status, score, timeSec, meta)` ngay trong `checkWin()` —
   khối này `postMessage({ type: 'PORTAL_GAME_RESULT', ... })` lên
   `index.html`.
4. **`index.html` nhận được `PORTAL_GAME_RESULT`**:
   - Ghi vào Leader Board local (đã có từ trước, không đổi).
   - Gọi `notifyGameResult()` của widget: ghi 1 dòng vào store `progress`,
     và nếu `status === 'win'` thì cộng thưởng `game_complete` (mặc định
     2.000 VIET) vào store `rewards`.
   - Nếu người chơi này là F1 của ai đó, tự cộng thêm 10% hoa hồng (local)
     cho người giới thiệu.
   - Gửi **đúng 1 giao dịch** `rewardTask(baseAmount)` lên contract — theo
     đúng thiết kế của `HienMauAffiliate.sol`, hợp đồng tự chia hoa hồng đa
     tầng (10% / 5% / 2%) ngược lên toàn bộ tuyến trên NGAY trong giao dịch
     đó, không cần gửi thêm giao dịch nào khác.
5. **Xem quảng cáo nhận thưởng**: nút trong widget hiện đang **giả lập**
   (đếm 15 giây) — xem phần "Gắn Google Ads thật" bên dưới để thay bằng SDK
   rewarded ad thật.

## Cấu hình contract / Pimlico API key

Mặc định `index.html` đã set:

```js
window.AFFILIATE_CONFIG = {
  affiliateContractAddress: '0x44f787D670Ff4Ef65334D6637960bb7Fe5E1231c',
  paymasterContractAddress: '0x177858e3450ff286E7d301100363567A555E435f',
};
```

Đây là 2 địa chỉ bạn cung cấp (giống hệt trong `ai-doctor-admin/.env`). Còn
thiếu **Pimlico API key** (bundler ERC-4337) — nếu không điền, các giao dịch
gasless sẽ lỗi 401/403. Cách điền:

```bash
cp affiliate/affiliate-config.example.js affiliate/affiliate-config.js
# sửa pimlicoBundlerUrl trong file affiliate-config.js
```

rồi thêm 1 thẻ `<script src="affiliate/affiliate-config.js"></script>` NGAY
TRƯỚC khối `<script type="module">` gọi `initAffiliate()` trong `index.html`
(và xoá/giữ nguyên khối `window.AFFILIATE_CONFIG` mặc định phía trên — file
sau sẽ override vì code dùng `window.AFFILIATE_CONFIG || {...}`, nên hãy đặt
`affiliate-config.js` load trước để nó thắng).

`affiliate/affiliate-config.js` đã được thêm vào `.gitignore` — **đừng
commit API key thật lên repo public**.

## Wire game mới vào hệ thống

Nếu bạn thêm 1 file game HTML mới vào repo và muốn nó tính thưởng, dán khối
sau vào cuối file (trước `</body>`), đổi `__PORTAL_GAME_ID__`/`__PORTAL_GAME_TITLE__`
theo game, và gọi `reportGameResult(status, score, timeSec, meta)` tại chỗ
game của bạn xác định thắng/thua:

```html
<script>
window.__PORTAL_GAME_ID__ = 'ten-game-cua-ban';
window.__PORTAL_GAME_TITLE__ = 'Tên hiển thị';
function reportGameResult(status, score, timeSec, meta) {
  try {
    window.parent.postMessage({
      type: 'PORTAL_GAME_RESULT',
      gameId: window.__PORTAL_GAME_ID__,
      gameTitle: window.__PORTAL_GAME_TITLE__,
      status, score: Math.round(score || 0),
      timeSec: Math.round((timeSec || 0) * 10) / 10,
      meta: meta || null, ts: Date.now()
    }, '*');
  } catch(e) {}
}
try { window.parent.postMessage({ type: 'PORTAL_GAME_READY', gameId: window.__PORTAL_GAME_ID__, gameTitle: window.__PORTAL_GAME_TITLE__ }, '*'); } catch(e) {}
</script>
```

Rồi thêm entry vào mảng `GAMES` trong `index.html` như các game khác.

## Gắn Google Ads (rewarded ad) thật

`affiliate/affiliate-widget.js` có hàm `handleWatchAd()` đang đếm giờ giả
lập. Khi có ad unit Google Ad Manager / AdSense rewarded thật, thay đoạn:

```js
function handleWatchAd() {
  if (watchingAd || claiming) return
  watchingAd = true
  adSecondsLeft = AD_WATCH_SECONDS
  render()
  tickAd()
}
```

bằng lệnh gọi SDK rewarded ad thật (vd `googletag.pubads()` rewarded ad hoặc
IMA SDK), và chỉ gọi `submitReward({ kind: 'ad_watch', ... })` **trong
callback "reward earned"** của SDK đó — tránh cho phép claim thưởng khi
chưa thực sự xem xong quảng cáo.

## Lưu ý bảo mật / vận hành

- `uuid` là định danh **ẩn danh theo thiết bị/trình duyệt** (không phải tài
  khoản có mật khẩu) — xoá localStorage/đổi trình duyệt sẽ tạo `uuid` mới,
  mất lịch sử thưởng local (dữ liệu on-chain vẫn còn theo địa chỉ ví cũ).
- Ví on-chain của mỗi `uuid` là ví ẩn danh sinh tự động (private key lưu
  localStorage, KHÔNG dùng giữ tài sản thật) — chỉ để ký giao dịch gasless.
- Contract `rewardTask()` có cooldown 4 giờ/ví cho MỌI loại thưởng
  (`ad_watch` lẫn `game_complete` dùng chung 1 hàm) — nếu người chơi thắng
  nhiều game liên tiếp trong 4 giờ, chỉ giao dịch đầu tiên lên chain thành
  công, các lần sau ghi `chainStatus: 'failed'` kèm lý do cooldown và sẽ tự
  gửi lại (`retryPendingRewards`) ở lần mở trang kế tiếp — phần thưởng vẫn
  được cộng dồn đầy đủ trong IndexedDB local, chỉ có đồng bộ on-chain là
  theo nhịp cooldown.
