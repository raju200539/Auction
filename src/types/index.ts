export type Team = {
  id: number;
  name: string;
  logo: string; // base64 string
  color: string; // hex color string
  purse: number;
  initialPurse: number;
  players: (Player & { bidAmount: number })[];
};

export type Player = {
  name: string;
  position: string;
  photoUrl: string;
  isElite?: boolean;
};

export type PlayerWithId = Player & { id: number };

export type AuctionStage = 'team-setup' | 'player-upload' | 'auction' | 'summary';