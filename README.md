# SFT Fashion Brand Website

A modern e-commerce website for SFT fashion brand built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🎨 Modern, responsive design with brand colors
- 🛍️ Product catalogue with dynamic loading
- 📦 Order management system
- 👥 Customer management
- 🗄️ Supabase PostgreSQL backend
- ⚡ Server-side rendering with Next.js 14+
- 🎯 TypeScript for type safety

## Brand Colors

- Primary: `#213E42` (Dark teal)
- Secondary: `#C9A78B` (Warm beige)
- Tertiary: `#F3DDC8` (Light peach)
- Quaternary: `#91A1A1` (Soft gray-blue)
- Light: `#FEEAD2` (Cream)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up your Supabase database with the following tables:

   **products**
   ```sql
   create table products (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     description text,
     price numeric not null,
     image_url text,
     category text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

   **customers**
   ```sql
   create table customers (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     email text not null,
     phone text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

   **orders**
   ```sql
   create table orders (
     id uuid default uuid_generate_v4() primary key,
     customer_id uuid references customers(id),
     product_id uuid references products(id),
     quantity integer not null,
     total_amount numeric,
     status text not null default 'pending',
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
vSFT/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── explore/             # Product catalogue
│   │   ├── order/               # Order pages
│   │   └── api/                 # API routes
│   │       ├── catalogue/
│   │       ├── customers/
│   │       └── orders/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── CatalogueGrid.tsx
│   │   ├── OrderForm.tsx
│   │   └── Pagination.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── types.ts            # TypeScript types
│   │   └── utils.ts            # Utility functions
│   └── styles/
│       └── globals.css         # Global styles
├── public/
│   └── assets/                 # Static assets
│       ├── logos/
│       ├── images/
│       └── videos/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

### Products
- `GET /api/catalogue` - Get all products (with pagination)
- `POST /api/catalogue` - Create a new product

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a new customer

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `PATCH /api/orders` - Update order status

## Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## License

ISC
