/**
 * affiliate-config.example.js
 *
 * Copy file này thành "affiliate-config.js" (đừng commit file thật lên repo
 * public nếu nó chứa API key riêng của bạn — file "affiliate-config.js" đã
 * được thêm vào .gitignore) rồi điền API key Pimlico của bạn.
 *
 * File này PHẢI được nạp bằng <script> thường (không type="module") và đặt
 * TRƯỚC thẻ <script type="module" src="affiliate/affiliate-init.js">, vì nó
 * chỉ gán vào window.AFFILIATE_CONFIG để affiliate-chain.js đọc lại.
 */
window.AFFILIATE_CONFIG = {
  // Địa chỉ contract Affiliate (HienMauAffiliate.sol) trên BSC Testnet
  affiliateContractAddress: '0x44f787D670Ff4Ef65334D6637960bb7Fe5E1231c',

  // Địa chỉ Paymaster tài trợ gas (HienMauPaymaster.sol) trên BSC Testnet
  paymasterContractAddress: '0x177858e3450ff286E7d301100363567A555E435f',

  // Bundler URL của Pimlico (ERC-4337) — lấy tại https://dashboard.pimlico.io
  // Định dạng: https://api.pimlico.io/v2/97/rpc?apikey=<API_KEY_CUA_BAN>
  pimlicoBundlerUrl: 'https://api.pimlico.io/v2/97/rpc?apikey=YOUR_PIMLICO_API_KEY',

  // (tuỳ chọn) RPC BSC Testnet riêng nếu không muốn dùng RPC công khai mặc định
  // rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
}
