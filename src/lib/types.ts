export type Rarity = "blue" | "purple" | "pink" | "red" | "gold";

export type SkinDTO = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  image: string;
};

export type CaseDTO = {
  id: string;
  name: string;
  price: number;
  image: string;
  label: string | null;
  tagline: string;
  story: string;
  category: string;
  accent: string;
  timerEndsAt: string | null;
  sortOrder: number;
};

export type CaseSkinDTO = SkinDTO & { chance: number };

export type DropDTO = {
  id: number;
  nickname: string;
  avatarHue: number;
  skinName: string;
  skinId: string;
  rarity: Rarity;
  price: number;
  caseName: string | null;
  caseId: string | null;
  createdAt: string;
  image: string;
};

export type UserDTO = {
  id: number;
  nickname: string;
  steamId: string;
  avatarHue: number;
  avatarUrl: string | null;
  isSteam: boolean;
  balance: number;
  tradeUrl: string | null;
  createdAt: string;
  casesOpened: number;
  upgradesDone: number;
  upgradesWon: number;
  totalDropValue: number;
  bestDropValue: number;
  bestDropName: string | null;
  streak: number;
  rareDrops: number;
};

export type NoticeDTO = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type InventoryDTO = {
  id: number;
  skin: SkinDTO;
  value: number;
  wear: string;
  floatThousandths: number;
  stattrak: boolean;
  source: string;
  acquiredAt: string;
  caseId: string | null;
  status: string;
};

export type OpenResult = {
  inventoryId: number;
  roll: number;
  rollMax: number;
  stattrak: boolean;
  wear: string;
  floatThousandths: number;
  value: number;
  skin: SkinDTO;
  chance: number;
};

export type TxDTO = {
  id: number;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type WithdrawalDTO = {
  id: number;
  amount: number;
  method: string;
  destination: string;
  status: string;
  createdAt: string;
};

export type UpgradeDTO = {
  id: number;
  success: boolean;
  stakeValue: number;
  chanceBps: number;
  stakeNote: string | null;
  createdAt: string;
  target: SkinDTO;
};

export type ChatDTO = {
  id: number;
  nickname: string;
  body: string;
  fromSupport: boolean;
  createdAt: string;
};

export type BootstrapDTO = {
  user: UserDTO | null;
  online: number;
  drops: DropDTO[];
  notifications: NoticeDTO[];
  unread: number;
};
