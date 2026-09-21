# SOVA Intelligence

A full-stack corporate website and content management platform developed for SOVA Intelligence.

The project combines a modern public-facing website with a custom administration portal for managing website content, including navigation, hero content, company information, expertise, services, projects, methodology, team members, and footer information.

## Overview

The application was developed using Next.js and TypeScript, with Prisma and PostgreSQL providing the data layer.

The project includes:

- Responsive corporate website
- Custom administration portal
- Database-driven website content
- Role-based administrator access
- Secure authentication and session handling
- Project and media management
- REST API routes for administrative operations
- PostgreSQL database integration through Prisma
- Modern responsive UI with Tailwind CSS
- Interactive UI components and animations

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Node.js

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Prisma
- ESLint

## Project Structure

```text
sova-intelligence/
├── app/
│   ├── admin/          # Administration portal
│   ├── api/            # Backend API routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/         # Reusable UI components
├── lib/                # Shared utilities and authentication
├── prisma/             # Prisma schema and database migrations
├── public/
│   ├── images/         # Website images
│   └── videos/         # Website media
│
├── next.config.ts
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Key Features

### Public Website

The public-facing website provides sections for:

- Hero
- About
- Expertise
- Services
- Projects
- Methodology
- Team
- Footer and contact information

Website content is retrieved from the database rather than being hardcoded directly into the page components.

### Administration Portal

The administration portal provides authenticated access for managing website content.

Administrative sections include:

- Navigation
- Hero
- About
- Expertise
- Services
- Projects
- Methodology
- Team
- Footer
- Authentication management

### Authentication

The application includes custom administrator authentication with:

- Email and password authentication
- Password hashing
- Administrator roles
- Active/inactive account status
- Signed session cookies
- Session expiration
- Protected administrative functionality

Authentication credentials and secrets are stored through environment variables and are not included in this repository.

## Database

The application uses PostgreSQL with Prisma ORM.

Database schema and migration files are included in the repository to document the application's data structure and database evolution.

The actual database connection credentials and private database contents are not included.

## Local Development

### 1. Clone the repository

```bash
git clone <repository-url>
cd sova-intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file:

```env
DATABASE_URL="your-postgresql-connection-string"
AUTH_SECRET="your-secret"
```

Do not commit `.env` or any file containing real credentials.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

To create a production build:

```bash
npm run build
```

To run the production application:

```bash
npm run start
```

## Database Migrations

Prisma migrations are stored in:

```text
prisma/migrations/
```

For development environments, migrations can be applied using:

```bash
npx prisma migrate dev
```

For production environments:

```bash
npx prisma migrate deploy
```

## Security

The repository does not contain:

- Database credentials
- Authentication secrets
- Administrator passwords
- Private keys
- Production environment files
- Private database records

Sensitive configuration is supplied through environment variables.

## Project Status

This project is maintained as a portfolio and development project showcasing full-stack web development, database integration, authentication, administration interfaces, and responsive UI implementation.

## License

No open-source license is currently specified.

The source code is published for portfolio and demonstration purposes. Rights to the underlying project, branding, content, and company materials remain subject to the applicable ownership and permissions.
