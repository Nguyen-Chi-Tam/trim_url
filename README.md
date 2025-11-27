# URL Shortener - React + Vite + Supabase

A modern URL shortener application built with React, Vite, and Supabase for authentication and database.

## Features

- 🔗 URL shortening with custom slugs
- 👤 User authentication (Sign up/Login)
- 📊 Analytics tracking (click counts)
- 🎨 Modern React UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🗄️ Supabase backend for data persistence
- 📖 API Documentation with Swagger

## Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- Supabase account

## Environment Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up Supabase

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings → API to find your project URL and anon key
4. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_actual_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```

### 4. Set up Supabase Database

Run the following SQL in your Supabase SQL editor to create the necessary tables:

```sql
-- Create URLs table
CREATE TABLE IF NOT EXISTS urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_slug VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Create policies for URLs table
CREATE POLICY "Users can view their own URLs" ON urls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own URLs" ON urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own URLs" ON urls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own URLs" ON urls
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for URL redirection (no auth required)
CREATE POLICY "Public can read URLs for redirection" ON urls
  FOR SELECT USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_urls_short_slug ON urls(short_slug);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_BASE_URL` | Base URL for shortened links (optional) | No |
| `NODE_ENV` | Environment mode (development/production) | No |

## Project Structure

```
src/
  ├── components/     # React components
  ├── db/            # Supabase database utilities
  ├── hooks/         # Custom React hooks
  ├── pages/         # Page components
  └── ...            # Other source files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **Frontend**: React, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **Deployment**: Vercel/Netlify (compatible)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
