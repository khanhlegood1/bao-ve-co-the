import { ethers } from "ethers";

// ABI rút gọn của Smart Contract Affiliate hỗ trợ Paymaster (Gasless) hoặc giao dịch thường
const AFFILIATE_ABI = [
  "function registerUser(string memory uuid, string memory referrerUuid, string memory organ) public",
  "function syncGameProgress(string memory uuid, uint256 level, uint256 score) public",
  "function getReferralData(string memory uuid) public view returns (string memory referrerUuid, address walletAddress, uint256 rewards)",
  "event UserRegistered(string indexed uuid, string referrerUuid, address indexed wallet)",
  "event ProgressSynced(string indexed uuid, uint256 level, uint256 score)"
];

// ABI giả định cho Paymaster hỗ trợ tài trợ phí gas cho Transactions của User
const PAYMASTER_ABI = [
  "function sponsorTransaction(address target, bytes calldata data) external returns (bool)"
];

const AFFILIATE_CONTRACT_ADDRESS = import.meta.env.VITE_AFFILIATE_CONTRACT_ADDRESS;
const PAYMASTER_CONTRACT_ADDRESS = import.meta.env.VITE_PAYMASTER_CONTRACT_ADDRESS;

export class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum as any);
    }
  }

  async connectWallet(): Promise<string | null> {
    if (!this.provider) {
      console.warn("Chưa cài đặt Metamask hoặc ví Web3");
      return null;
    }
    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();
    return await this.signer.getAddress();
  }

  /**
   * Đăng ký User và liên kết Người giới thiệu (Affiliate) lên BSC Testnet.
   * Nếu có Paymaster được cấu hình, có thể tiến hành tích hợp Meta-Transaction cứu cánh phí gas.
   */
  async registerAffiliateOnChain(uuid: string, referrerUuid: string | null, organ: string): Promise<boolean> {
    try {
      if (!this.signer) {
        const connected = await this.connectWallet();
        if (!connected) return false;
      }

      const affiliateContract = new ethers.Contract(
        AFFILIATE_CONTRACT_ADDRESS,
        AFFILIATE_ABI,
        this.signer!
      );

      const ref = referrerUuid || "";
      
      // Thực hiện giao dịch đăng ký trực tiếp hoặc thông qua Paymaster
      console.log(`Đang ghi nhận liên kết Affiliate lên BSC Testnet: ${uuid} giới thiệu bởi ${ref}`);
      
      const tx = await affiliateContract.registerUser(uuid, ref, organ);
      await tx.wait();
      
      console.log("Đăng ký On-chain thành công, mã hash:", tx.hash);
      return true;
    } catch (error) {
      console.error("Lỗi khi đồng bộ blockchain:", error);
      return false;
    }
  }

  /**
   * Đồng bộ tiến trình chơi game (Màn chơi, điểm số) lên On-chain phục vụ trả thưởng
   */
  async syncProgressOnChain(uuid: string, level: number, score: number): Promise<boolean> {
    try {
      if (!this.signer) return false;
      const contract = new ethers.Contract(AFFILIATE_CONTRACT_ADDRESS, AFFILIATE_ABI, this.signer);
      const tx = await contract.syncGameProgress(uuid, level, score);
      await tx.wait();
      return true;
    } catch (e) {
      console.error("Lỗi đồng bộ tiến trình chơi game lên BSC:", e);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();