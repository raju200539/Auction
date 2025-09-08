import AuctionControls from './auction-controls';
import PlayerDisplay from './player-display';

export default function AuctionCore() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
      <div className="flex justify-center items-start h-full">
        <PlayerDisplay />
      </div>
      <div className="h-full">
        <AuctionControls />
      </div>
    </div>
  );
}
