# Peer Compare

A modern, responsive client side only web application designed to help you analyze and compare financial metrics for publicly traded companies. Pull data from live APIs, create your own custom metrics, and build comparison groups to gain new insights.

All your data (company list, API keys, custom metrics) is saved securely in your browser's local storage.


![PeerCompareLogo](src/assets/logo-with-name.png?raw=true "PeerCompareLogo")


## Features

### Add Companies To Watch

Add companies by their stock ticker.

### Live Data Fetching

Pulls financial data from external data providers (e.g., Alpha Vantage, FMP, Polygon).

### Custom Metric Engine

Create your own complex financial metrics using a simple formula builder (e.g., (totalDebt / ebitda)).

### Comparison Groups

Select multiple companies to create a "Comparison Group" (e.g., "Big Tech Peers") that aggregates their financial data.

### Detailed Comparison

A powerful table view to compare metrics side-by-side for all your companies and groups.

### Data Export

Export your comparison table to CSV, JSON, or Excel.

### Detailed View

A slide-in panel to see a detailed breakdown of all metrics for a single company or group.

### Persistent State

All companies, groups, and settings are saved to Local Storage.

## Tech Stack

React (Vite)

TypeScript

Material-UI (MUI): For the component library and styling.

Lucide-react: For icons.

React Context: For state management.

## Getting Started & Usage

Install Dependencies:

```
npm install
```

Run the Development Server:

```
npm run dev
```

### Configure API Key (Required):

The application requires an API key to fetch financial data.

On first launch, open the Settings dialog from the top bar.

Select a data provider (e.g., Alpha Vantage).

Enter your personal API key and click Save.

The app is now ready to fetch data.

## How to Use:

Add Companies: Click the floating + button to open the "Add Company" dialog and enter a stock ticker (e.g., AAPL).

Create Custom Metrics: Click "Custom Metrics" in the top bar to open the editor. Here you can create and save your own formulas using available financial data fields.

Select Items: Click the checkbox on any company or group tile to select it.

Compare Items: Once you have 2 or more items selected, "Compare Selected" and "Create Group" buttons will appear.

View Details: Click anywhere on a tile (except the checkbox or remove button) to open a detailed slide-in panel with all metrics for that item.
