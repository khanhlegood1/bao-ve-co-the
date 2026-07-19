/**
 * affiliate-chain.js — Ghi quan hệ Affiliate + phần thưởng game lên
 * blockchain (BSC Testnet), dùng Account Abstraction (ERC-4337) gasless qua
 * Pimlico bundler + `HienMauPaymaster`. Port thuần JS (ES module, không cần
 * build step) từ gameAffiliateChain.js của repo ai-doctor-admin.
 *
 * Vì bao-ve-co-the là các trang HTML tĩnh (không Vite/webpack), viem và
 * permissionless được nạp trực tiếp từ CDN esm.sh, đúng version đã dùng ở
 * repo tham khảo (viem@2.55.2, permissionless@0.3.7) để đảm bảo cùng hành vi.
 *
 * ABI thật của `HienMauAffiliate.sol`:
 *   - registerReferral(address _referrer) external
 *       msg.sender tự trở thành referee, chỉ cần truyền địa chỉ referrer.
 *       Revert nếu: referrer == address(0), referrer == msg.sender, hoặc
 *       msg.sender đã có referrer từ trước ("Already registered").
 *   - rewardTask(uint256 _baseAmount) external
 *       Cộng _baseAmount vào balances[msg.sender] RỒI TỰ ĐỘNG chia hoa hồng
 *       đa tầng (levelRates = [10,5,2]%) ngược lên toàn bộ tuyến trên — KHÔNG
 *       cần gọi thêm giao dịch nào khác để trả hoa hồng.
 *       Revert nếu chưa đủ 4 giờ kể từ lần gọi trước của CHÍNH msg.sender
 *       ("Task cooldown active: come back later") — cooldown tính theo VÍ,
 *       dùng chung cho mọi loại thưởng (ad_watch/game_complete).
 *
 * → 1 lần gọi rewardTask() là đủ để vừa cộng điểm cho người chơi vừa trả hoa
 * hồng cho F1/F2/F3 NGAY TRONG CÙNG 1 giao dịch.
 *
 * Paymaster (`HienMauPaymaster.sol`) chỉ tài trợ gas cho các cuộc gọi có
 * dest == affiliateContract && value == 0 qua hàm chuẩn `execute(...)` của
 * Simple Smart Account.
 *
 * Mỗi user (uuid) có 1 smart-account ví ẩn danh riêng, private key sinh 1
 * lần và lưu trong localStorage — KHÔNG dùng để giữ tài sản thật, chỉ để ký
 * các userOperation gasless.
 *
 * CẤU HÌNH: đặt window.AFFILIATE_CONFIG *trước khi* nạp file này (xem
 * affiliate/affiliate-config.example.js) để đổi contract / Pimlico API key
 * mà không cần sửa trực tiếp file này.
 */

import { createPublicClient, http, encodeFunctionData } from 'https://esm.sh/viem@2.55.2'
import { bscTestnet } from 'https://esm.sh/viem@2.55.2/chains'
import { createSmartAccountClient } from 'https://esm.sh/permissionless@0.3.7'
import { toSimpleSmartAccount } from 'https://esm.sh/permissionless@0.3.7/accounts'
import { privateKeyToAccount } from 'https://esm.sh/viem@2.55.2/accounts'
import {
  markReferralSynced,
  markReferralFailed,
  markRewardSynced,
  markRewardFailed,
} from './affiliate-db.js'

const CFG = (typeof window !== 'undefined' && window.AFFILIATE_CONFIG) || {}

const PIMLICO_URL = CFG.pimlicoBundlerUrl
  || 'https://api.pimlico.io/v2/97/rpc?apikey=YOUR_PIMLICO_API_KEY'

const PAYMASTER_ADDRESS = CFG.paymasterContractAddress
  || '0x177858e3450ff286E7d301100363567A555E435f'
const AFFILIATE_CONTRACT = CFG.affiliateContractAddress
  || '0x44f787D670Ff4Ef65334D6637960bb7Fe5E1231c'

const ENTRY_POINT = { address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', version: '0.6' }

// ABI thật, lấy nguyên văn từ artifact đã compile của HienMauAffiliate.sol
const AFFILIATE_ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'from', type: 'address' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'level', type: 'uint256' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'CommissionPaid', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'user', type: 'address' }, { indexed: true, internalType: 'address', name: 'referrer', type: 'address' }], name: 'ReferralRegistered', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'user', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'TaskRewarded', type: 'event' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'balances', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'lastTaskTime', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'levelRates', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'referrers', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '_referrer', type: 'address' }], name: 'registerReferral', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '_baseAmount', type: 'uint256' }], name: 'rewardTask', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256[]', name: '_newRates', type: 'uint256[]' }], name: 'setLevelRates', outputs: [], stateMutability: 'nonpayable', type: 'function' },
]

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(CFG.rpcUrl || 'https://data-seed-prebsc-1-s1.binance.org:8545'),
})

// ─── Ví ẩn danh riêng cho mỗi uuid ──────────────────────────────────────
function getOrGeneratePrivateKey(uuid) {
  const storageKey = `game_affiliate_pk_${uuid}`
  let pk = localStorage.getItem(storageKey)
  if (!pk) {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    pk = '0x' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(storageKey, pk)
  }
  return pk
}

export function getGameAffiliateWalletAddress(uuid) {
  if (!uuid) return null
  const pk = getOrGeneratePrivateKey(uuid)
  return privateKeyToAccount(pk).address
}

async function getSmartAccountClient(uuid) {
  const owner = privateKeyToAccount(getOrGeneratePrivateKey(uuid))
  const smartAccount = await toSimpleSmartAccount({
    client: publicClient,
    owner,
    entryPoint: ENTRY_POINT,
  })
  return createSmartAccountClient({
    account: smartAccount,
    chain: bscTestnet,
    bundlerTransport: http(PIMLICO_URL),
    paymaster: {
      getPaymasterStubData: async () => ({ paymasterAndData: PAYMASTER_ADDRESS }),
      getPaymasterData: async () => ({ paymasterAndData: PAYMASTER_ADDRESS }),
    },
  })
}

// Cache 1 smart-account-client theo uuid trong phiên hiện tại để tránh khởi
// tạo lại (và gọi getPaymasterStubData) mỗi lần gửi transaction.
const clientCache = new Map()
async function getCachedSmartAccountClient(uuid) {
  if (clientCache.has(uuid)) return clientCache.get(uuid)
  const client = await getSmartAccountClient(uuid)
  clientCache.set(uuid, client)
  return client
}

async function sendGaslessCall(uuid, { functionName, args }) {
  const smartAccountClient = await getCachedSmartAccountClient(uuid)
  const callData = encodeFunctionData({ abi: AFFILIATE_ABI, functionName, args })
  const txHash = await smartAccountClient.sendTransaction({
    to: AFFILIATE_CONTRACT,
    data: callData,
    value: 0n,
    maxFeePerGas: 5000000000n,
    maxPriorityFeePerGas: 5000000000n,
  })
  return txHash
}

function isCooldownError(error) {
  return /cooldown/i.test(error?.message || String(error))
}

function isAlreadyRegisteredError(error) {
  return /Already registered/i.test(error?.message || String(error))
}

// ─── 1) Ghi quan hệ referral lên chain ─────────────────────────────────────
// msg.sender (= ví của refereeUuid) tự trở thành người được giới thiệu, chỉ
// cần truyền địa chỉ ví của referrerUuid.
export async function registerReferralOnChain({ id, referrerUuid, refereeUuid }) {
  try {
    const referrerAddress = getGameAffiliateWalletAddress(referrerUuid)
    const txHash = await sendGaslessCall(refereeUuid, {
      functionName: 'registerReferral',
      args: [referrerAddress],
    })
    if (id) await markReferralSynced(id, txHash)
    return { ok: true, txHash }
  } catch (error) {
    // "Already registered" trên chain không phải lỗi thật.
    if (isAlreadyRegisteredError(error)) {
      if (id) await markReferralSynced(id, null)
      return { ok: true, txHash: null, note: 'already_registered_onchain' }
    }
    console.error('[affiliate-chain] registerReferralOnChain lỗi:', error)
    if (id) await markReferralFailed(id, error?.message || String(error))
    return { ok: false, error: error?.message || String(error) }
  }
}

// ─── 2) Ghi thưởng (xem QC / hoàn thành game) lên chain ───────────────────
// rewardTask() TỰ ĐỘNG chia hoa hồng lên toàn bộ tuyến trên trong CÙNG 1
// giao dịch — không gọi thêm giao dịch nào khác cho phần hoa hồng.
export async function recordRewardOnChain({ id, uuid, amount }) {
  try {
    const amountUint = BigInt(Math.max(0, Math.round(Number(amount) || 0)))
    const txHash = await sendGaslessCall(uuid, {
      functionName: 'rewardTask',
      args: [amountUint],
    })
    if (id) await markRewardSynced(id, txHash)
    return { ok: true, txHash }
  } catch (error) {
    const cooldown = isCooldownError(error)
    console.error('[affiliate-chain] recordRewardOnChain lỗi:', error)
    if (id) await markRewardFailed(id, cooldown ? 'Đang trong thời gian chờ (cooldown 4h/ví) — sẽ tự đồng bộ lại sau.' : (error?.message || String(error)))
    return { ok: false, error: error?.message || String(error), cooldown }
  }
}

// ─── Đồng bộ lại toàn bộ reward đang "pending"/"failed" ────────────────────
export async function retryPendingRewards(pendingRows) {
  const results = []
  for (const row of pendingRows) {
    // eslint-disable-next-line no-await-in-loop
    const res = await recordRewardOnChain({ id: row.id, uuid: row.uuid, amount: row.amount })
    results.push({ id: row.id, ...res })
  }
  return results
}
