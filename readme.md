# 📊 CSV Analyzer

A powerful, AI-powered data analysis tool that transforms your CSV, JSON, and TSV files into interactive visualizations and insights.

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.9-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🔧 Core Functionality
- **📁 Multi-format Support**: Upload and analyze CSV, JSON, and TSV files
- **🤖 AI-Powered Analysis**: Get intelligent insights using AI models (Euron, Gemini, OpenAI)
- **📈 Interactive Visualizations**: Automatic chart generation (Bar, Line, Area, Pie, Tables, Metrics)
- **💬 Chat with Data**: Ask follow-up questions about your analysis
- **📊 Data Preview**: Instant preview of uploaded data with proper formatting
- **🔄 Drag & Drop**: Easy file upload with drag and drop support

### 🎨 User Experience
- **🌙 Dark/Light Theme**: Toggle between themes for comfortable viewing
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⏱️ Query History**: Save and manage your analysis history
- **⚡ Real-time Results**: Fast analysis with instant visualization
- **📥 Export Reports**: Download comprehensive analysis reports as JSON

### 🔌 Advanced Features
- **🔑 Multi-API Support**: Configure different AI providers (Backend, OpenAI, Gemini, Euron)
- **🎯 Custom Graph Types**: Choose specific visualization types or let AI decide
- **🔍 Search History**: Quickly find previous analyses
- **🗂️ File Type Detection**: Automatic format recognition and parsing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/uzumaki-ak/ai-csv-json-tsv-etc.-analyzer
cd csv-analyzer


npm install
# or
yarn install
# or
pnpm install

#run
npm run dev
# or
yarn dev
# or
pnpm dev

#open
Open your browser
Navigate to http://localhost:3000



📖 How to Use
1. Upload Your Data
Click the upload area or drag & drop your file

Supported formats: CSV, JSON, TSV

View instant data preview

2. Ask Your Question
Enter natural language queries like:

"Show revenue trends by month"

"Display top 5 products by sales"

"Compare performance across departments"

3. Choose Visualization
Select from: Bar, Line, Area, Pie, Table, or Metric

Use "Auto" to let AI choose the best visualization

4. Analyze & Explore
Get instant AI-powered insights

Ask follow-up questions in the chat

Download comprehensive reports

🛠️ Technology Stack
Frontend: Next.js 15, React 19, TypeScript

Styling: Tailwind CSS 4, Lucide React Icons

Charts: Recharts for data visualization

AI Integration: Multi-provider support (OpenAI, Gemini, Euron)

State Management: React Hooks (useState, useEffect, useRef)

Storage: Local Storage for history and settings

⚙️ Configuration
API Providers
Backend (Recommended): Uses your server-side API

Frontend: Direct integration with AI providers using your keys

Supported Models
Euron: Recommended for best performance

Gemini: Google's AI model

OpenAI: GPT-4 for advanced analysis

#proj stru
csv-analyzer/
├── app/
│   ├── page.tsx              # Main application page
│   ├── layout.tsx            # Root layout
│   └── api/                  # API routes
├── components/
│   ├── csv-analyzer.tsx      # Main component
│   └── ui/                   # UI components
├── lib/
│   └── utils.ts              # Utility functions
└── public/                   # Static assets

#🔧 API Routes
/api/analyze
Method: POST

Purpose: Analyze CSV data and generate visualizations

Body: { prompt, model, apiProvider, apiKeys }

/api/chat
Method: POST

Purpose: Handle follow-up questions about analysis

Body: { prompt, model, apiProvider, apiKeys }

🤝 Contributing
We welcome contributions! Please feel free to submit issues and pull requests.

Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request