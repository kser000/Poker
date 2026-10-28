# 撲克學習站

個人撲克學習站（中文介面）。V1：可互動翻前 13×13 範圍設計器。

- **不包含**真實金流或多人對戰
- **技術**：Next.js（App Router）+ TypeScript + Tailwind CSS
- **程式碼**：`D:\Poker`（GitHub 同步）
- **資料庫**：SQLite 於 `E:\Poker\db\ranges.sqlite`（見該目錄 README）

## 本機開發

需要 Node.js 18+（建議 20/22）與 npm。需可寫入 `E:\Poker`。

```bash
cd D:\Poker
npm install
npm run dev
```

- 範圍設計器：[http://localhost:3000/designer](http://localhost:3000/designer)
- 我的範圍表：[http://localhost:3000/ranges](http://localhost:3000/ranges)

## V1 功能

- 13×13 矩陣：拖曳上色、多色疊加頻率、懸停放大、右鍵調頻率
- 行動：棄牌／跟注／加注／全下
- SQLite 持久化 + localStorage 客戶端快取；舊 localStorage 可自動遷移
- 左上可拖曳／收合導覽側欄

## 資料目錄（E:\Poker）

```
E:\Poker\
├── db\ranges.sqlite
├── ranges\          （預留匯出）
└── docs\
```

可選環境變數：`POKER_DATA_ROOT`（預設 `E:\Poker`）。

## 授權與用途

僅供個人學習使用。
