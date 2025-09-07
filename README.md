# League Auctioneer

A web application designed for auctioneers to conduct a dynamic and engaging fantasy sports league auction draft. It provides a streamlined interface for managing teams, players, and the live auction process.

## Features

- **Team Setup**: Configure multiple teams with custom names, logos, colors, and initial purse amounts.
- **Player Lists**: Upload separate CSV files for "elite" and "normal" player tiers. The auction proceeds through these tiers, including a final round for any skipped players.
- **Live Auction Interface**: A dedicated view for the auctioneer to assign players, enter winning bids, skip players, and undo the last transaction if a mistake is made.
- **Real-time Dashboard**: A sidebar shows all teams, their remaining purse, and the number of players they've acquired, which updates live as the auction progresses.
- **Auction Summary**: Once the auction is complete, view a detailed results page with summaries by team and by player (sorted by bid amount).
- **Downloadable Player Cards**: From the summary page, you can generate and download stylish digital cards for each auctioned player, perfect for sharing.
- **Past Auction History**: The application saves completed auctions in your browser's local storage, allowing you to review the results of past events.
- **Data Export**: Export final team and player summaries as CSV files for easy record-keeping.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) (version 18.x or higher) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    Run the following command in the project's root directory to install all the necessary packages.
    ```bash
    npm install
    ```

### Running the Application

Once the dependencies are installed, you can start the local development server:

```bash
npm run dev
```

This will start the application in development mode. Open your web browser and navigate to [http://localhost:9002](http://localhost:9002) to see the application in action.

## How to Use the App

1.  **Initial Setup**: On the first screen, enter the number of teams participating in the auction.
2.  **Team Details**: For each team, provide a name, an initial purse, and optionally a logo image and a team color.
3.  **Player Upload**: Upload your player lists. You can provide a CSV for "elite" players and another for "normal" players. Each CSV must have `Name` and `Position` columns. A `Photo URL` column is optional.
4.  **Conduct Auction**: The auction will begin. The auctioneer can assign players to teams by selecting a team, entering the winning bid, and clicking "Assign Player".
5.  **View Summary**: After all players have been auctioned, the app will navigate to the summary page, where you can review all the results.
6.  **Past Auctions**: You can access the results of previously completed auctions from the initial setup page.
