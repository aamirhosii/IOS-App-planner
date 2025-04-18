# PlanDropper iOS App

A React Native/Expo app for PlanDropper, optimized for iOS.

## Getting Started

### Prerequisites

- Node.js
- Expo CLI
- iOS Simulator or physical iOS device
- Expo Go app (for testing on physical devices)

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/your-username/plandropper.git
   cd plandropper
   \`\`\`

2. Install dependencies
   \`\`\`
   npm install
   \`\`\`

3. Start the development server
   \`\`\`
   npx expo start
   \`\`\`

4. Run on iOS
   - Press `i` to open in iOS Simulator
   - Or scan the QR code with your iOS device (Camera app)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Features

- User authentication
- Plan creation and management
- Real-time messaging
- Location-based services
- Profile management

## Project Structure

- `/screens` - App screens
- `/components` - Reusable UI components
- `/navigation` - Navigation configuration
- `/contexts` - React contexts for state management
- `/utils` - Utility functions
- `/assets` - Images and other static assets
