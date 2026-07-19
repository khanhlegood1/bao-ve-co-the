import { useState, useEffect } from "react";
import { UserProfile, saveUserProfile, getLocalUserByAnonymousId, getUserProfile } from "../services/indexedDB";
import { blockchainService } from "../services/blockchainService";

// Công thức tạo UUID duy nhất của người chơi "Anh Hùng"
export const generateUUID = (): string => {
  const prefix = "AH"; // Anh Hùng
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${randomChars}`;
};

export const useAffiliateAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Khởi động luồng đăng nhập ẩn danh / Lấy thông tin từ URL giới thiệu (Affiliate Link)
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      
      // Lấy referrer UUID từ URL query parameter (?ref=AH-...)
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");

      // Kiểm tra trong LocalStorage/IndexDB xem đã từng tạo tài khoản ẩn danh chưa
      let localAnonId = localStorage.getItem("anon_id");
      if (!localAnonId) {
        localAnonId = "anon-" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("anon_id", localAnonId);
      }

      let profile = await getLocalUserByAnonymousId(localAnonId);

      if (!profile) {
        // Tạo tài khoản ẩn danh mới nếu là người chơi lần đầu
        const newUuid = generateUUID();
        profile = {
          uuid: newUuid,
          anonymousId: localAnonId,
          username: `Người hùng ${newUuid.split('-')[2]}`,
          email: null,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUuid}`, // Avatar mặc định ẩn danh
          selectedOrgan: "Heart", // Mặc định là Tim (Nội tạng chính)
          referrerUuid: ref,
          isSyncedToBlockchain: false,
          gameProgress: {
            level: 1,
            score: 0,
            completedQuests: [],
            lastUpdated: Date.now()
          }
        };
        await saveUserProfile(profile);
      }

      setUser(profile);
      setLoading(false);
    };

    initSession();
  }, []);

  // Chọn "Anh Hùng" dựa trên bộ phận nội tạng cơ thể
  const chooseOrgan = async (organ: "Heart" | "Liver" | "Lungs" | "Kidneys" | "Stomach") => {
    if (!user) return;
    const updated = { ...user, selectedOrgan: organ };
    await saveUserProfile(updated);
    setUser(updated);
  };

  // Đồng bộ hóa với tài khoản Google (lấy thông tin, Email & Avatar)
  const syncWithGoogle = async (googleUser: { email: string; name: string; picture: string }) => {
    if (!user) return;

    const updated: UserProfile = {
      ...user,
      email: googleUser.email,
      username: googleUser.name,
      avatar: googleUser.picture // Lấy Avatar thật từ Google Account thay cho bottts
    };

    await saveUserProfile(updated);
    setUser(updated);

    // Tiến hành đồng bộ liên kết Affiliate lên Smart Contract BSC Testnet
    const wallet = await blockchainService.connectWallet();
    if (wallet) {
      setWalletAddress(wallet);
      const success = await blockchainService.registerAffiliateOnChain(
        updated.uuid,
        updated.referrerUuid,
        updated.selectedOrgan
      );
      if (success) {
        const syncedUser = { ...updated, isSyncedToBlockchain: true };
        await saveUserProfile(syncedUser);
        setUser(syncedUser);
      }
    }
  };

  // Cập nhật tiến trình chơi Game của User
  const updateGameProgress = async (level: number, score: number, questId?: string) => {
    if (!user) return;

    const completedQuests = [...user.gameProgress.completedQuests];
    if (questId && !completedQuests.includes(questId)) {
      completedQuests.push(questId);
    }

    const updated: UserProfile = {
      ...user,
      gameProgress: {
        level,
        score,
        completedQuests,
        lastUpdated: Date.now()
      }
    };

    await saveUserProfile(updated);
    setUser(updated);

    // Đồng bộ tiến trình lên Blockchain BSC Testnet nếu ví đã kết nối
    if (user.isSyncedToBlockchain) {
      await blockchainService.syncProgressOnChain(user.uuid, level, score);
    }
  };

  return {
    user,
    loading,
    walletAddress,
    chooseOrgan,
    syncWithGoogle,
    updateGameProgress,
    connectWallet: async () => {
      const addr = await blockchainService.connectWallet();
      setWalletAddress(addr);
      return addr;
    }
  };
};