import React, { useState } from "react";
import { useAffiliateAuth } from "../hooks/useAffiliateAuth";

export const AuthAndAffiliate: React.FC = () => {
  const { user, loading, walletAddress, chooseOrgan, syncWithGoogle, connectWallet } = useAffiliateAuth();
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  if (loading || !user) {
    return <div className="p-8 text-center text-white">Đang tải cấu hình game...</div>;
  }

  // Giả lập callback đăng nhập Google thành công
  const handleFakeGoogleLogin = () => {
    if (!googleEmailInput || !googleNameInput) {
      alert("Vui lòng điền thông tin mô phỏng Google!");
      return;
    }
    syncWithGoogle({
      email: googleEmailInput,
      name: googleNameInput,
      picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${googleNameInput}`
    });
  };

  const getReferralLink = () => {
    return `${window.location.origin}?ref=${user.uuid}`;
  };

  const organsList = [
    { key: "Heart", name: "Tim Quả Cảm", color: "bg-red-500" },
    { key: "Liver", name: "Gan Khỏe Mạnh", color: "bg-orange-600" },
    { key: "Lungs", name: "Phổi Trong Lành", color: "bg-blue-400" },
    { key: "Kidneys", name: "Thận Thải Độc", color: "bg-purple-500" },
    { key: "Stomach", name: "Dạ Dày Co Bóp", color: "bg-yellow-500" }
  ];

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-slate-900 rounded-2xl shadow-xl text-white border border-slate-800">
      <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Màn hình Anh Hùng - Affiliate</h2>

      {/* Thông tin nhân vật */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-slate-800 rounded-xl">
        <img
          src={user.avatar || ""}
          alt="Avatar"
          className="w-16 h-16 rounded-full border-2 border-green-500 bg-slate-700"
        />
        <div>
          <h3 className="text-lg font-bold">{user.username}</h3>
          <p className="text-xs text-slate-400">ID Game: {user.uuid}</p>
          <p className="text-xs text-slate-400">Loại: Ẩn danh (Địa phương)</p>
          {user.referrerUuid && (
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              Được giới thiệu bởi: {user.referrerUuid}
            </p>
          )}
        </div>
      </div>

      {/* Chọn nội tạng bảo vệ */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Lựa chọn Anh Hùng Nội Tạng Bảo Vệ:</h4>
        <div className="grid grid-cols-2 gap-2">
          {organsList.map((organ) => (
            <button
              key={organ.key}
              onClick={() => chooseOrgan(organ.key as any)}
              className={`p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                user.selectedOrgan === organ.key
                  ? `${organ.color} border-white scale-105 shadow-md`
                  : "bg-slate-800 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {organ.name}
            </button>
          ))}
        </div>
      </div>

      {/* Đồng bộ hóa Google */}
      {!user.email ? (
        <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-dashed border-slate-600">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Đồng bộ Google & Tải Avatar thực:</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nhập Tên Google của bạn"
              value={googleNameInput}
              onChange={(e) => setGoogleNameInput(e.target.value)}
              className="w-full px-3 py-2 text-black rounded text-sm outline-none"
            />
            <input
              type="email"
              placeholder="Nhập Email Google của bạn"
              value={googleEmailInput}
              onChange={(e) => setGoogleEmailInput(e.target.value)}
              className="w-full px-3 py-2 text-black rounded text-sm outline-none"
            />
            <button
              onClick={handleFakeGoogleLogin}
              className="w-full bg-red-600 hover:bg-red-700 py-2 rounded text-sm font-bold transition-all"
            >
              Kết nối Google Account
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-emerald-950 rounded-xl border border-emerald-800">
          <p className="text-sm text-emerald-300">✓ Đã đồng bộ tài khoản Google</p>
          <p className="text-xs text-emerald-400">Email: {user.email}</p>
        </div>
      )}

      {/* Tương tác Web3 BSC Testnet */}
      <div className="mb-6 p-4 bg-slate-800 rounded-xl">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Đồng bộ Blockchain BSC Testnet</h4>
        {!walletAddress ? (
          <button
            onClick={connectWallet}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 py-2 rounded text-sm font-bold transition-all"
          >
            Kết nối Ví Web3 (MetaMask)
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-yellow-400 truncate">Ví kết nối: {walletAddress}</p>
            <p className="text-xs">
              Trạng thái đồng bộ On-chain:{" "}
              <span className={user.isSyncedToBlockchain ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                {user.isSyncedToBlockchain ? "ĐÃ ĐỒNG BỘ" : "CHƯA ĐỒNG BỘ"}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Link chia sẻ Affiliate */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 mb-2">Link giới thiệu của bạn (Nhận 10% thưởng):</h4>
        <input
          type="text"
          readOnly
          value={getReferralLink()}
          className="w-full px-3 py-1.5 text-xs text-green-400 bg-slate-900 rounded border border-slate-700 select-all cursor-pointer mb-2"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(getReferralLink());
            alert("Đã sao chép link Affiliate!");
          }}
          className="w-full bg-slate-800 hover:bg-slate-700 py-1.5 rounded text-xs transition-all"
        >
          Sao chép Link
        </button>
      </div>
    </div>
  );
};