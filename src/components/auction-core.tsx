import AuctionControls from './auction-controls';
import PlayerDisplay from './player-display';

export default function AuctionCore() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      <div className="h-full">
        <PlayerDisplay />
      </div>
      <div className="h-full">
        <AuctionControls />
      </div>
    </div>
  );
}
