# NexusAuth — Enterprise Authentication Platform

NexusAuth is a production-grade authentication application built with Next.js (App Router), TypeScript (strict mode), Tailwind CSS, React Hook Form, Zod validation, and Supabase SSR integration architecture.

---

## 🎨 Visual Identity & Theme
- **Background**: Deep midnight navy canvas (`#070913`)
- **Primary Actions**: Electric violet gradients (`#8b5cf6` to `#7c3aed`) with glow hover states
- **Accents**: Cyan glow highlights (`#06b6d4`)
- **Surfaces**: Layered dark glassmorphic panels with subtle borders and shadows
- **Typography**: Clean Geist font hierarchy with generous spacing

---

## 📁 Project Structure

```
├── docs/
│   └── PROJECT_PROGRESS.md        # Milestone tracking & verification record
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── callback/page.tsx  # OAuth & PKCE code exchange handler
│   │   │   └── verify/page.tsx    # Email verification UI & instruction hub
│   │   ├── forgot-password/
│   │   │   └── page.tsx           # 4-step recovery wizard (Email -> 6-digit OTP -> Reset -> Success)
│   │   ├── login/
│   │   │   └── page.tsx           # Sign-in screen (Email or phone, password toggle, remember-me)
│   │   ├── register/
│   │   │   └── page.tsx           # Registration screen (Full name, email, DOB, phone, address, strength meter)
│   │   ├── globals.css            # Midnight navy design system & token definitions
│   │   ├── layout.tsx             # Root layout with navbar and footer
│   │   └── page.tsx               # Homepage architecture hub & screen navigator
│   ├── components/
│   │   ├── auth/
│   │   │   └── GoogleButton.tsx   # Google OAuth social action button
│   │   └── ui/
│   │       ├── Alert.tsx          # Accessible semantic alert banners
│   │       ├── Badge.tsx          # Status tag badges
│   │       ├── Button.tsx         # Styled button with loading state & icons
│   │       ├── Card.tsx           # Glassmorphism container with header/content/footer
│   │       ├── Input.tsx          # Form input with icon slots & error handling
│   │       ├── Navbar.tsx         # Sticky navigation with mobile menu drawer
│   │       ├── OtpInput.tsx       # 6-digit individual interactive OTP boxes
│   │       ├── PasswordInput.tsx  # Password field with show/hide toggle
│   │       └── PasswordStrengthMeter.tsx # Live password strength evaluation
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts          # Browser Supabase client helper
│       │   └── server.ts          # Server SSR Supabase client helper
│       ├── utils.ts               # Tailwind class merge helper
│       └── validation.ts          # Strict Zod schemas & password strength logic
├── .env.example                   # Safe environment variable placeholders
├── .gitignore                     # Git ignore rules (protects credentials)
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript strict configuration
```

---

## 🛠️ Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm**: v9 or higher

### 2. Install Dependencies
Dependencies are already installed in this directory. If you ever clone fresh or need to reinstall:
```bash
npm install
```

### 3. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```

The application will start on `http://localhost:3000`.

Open your browser and navigate to:
- **Homepage & Hub**: [http://localhost:3000](http://localhost:3000)
- **Registration**: [http://localhost:3000/register](http://localhost:3000/register)
- **Sign In**: [http://localhost:3000/login](http://localhost:3000/login)
- **Password Recovery**: [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password)
- **Email Verification UI**: [http://localhost:3000/auth/verify](http://localhost:3000/auth/verify)
- **OAuth Callback UI**: [http://localhost:3000/auth/callback](http://localhost:3000/auth/callback)

### 4. Build for Production
To verify an optimized production bundle:
```bash
npm run build
```

To run the production server locally after building:
```bash
npm run start
```

### 5. Run Linting
```bash
npm run lint
```

---

## 🔒 Security & Validation Details (Phase 1)
- **Client-Side Zod Schemas**: Strict validation for emails, passwords, age requirement (13+ years), phone digits, and address details.
- **Dynamic Password Strength Meter**: Evaluates length (8+), uppercase, lowercase, numbers, and symbols with live visual feedback.
- **Zero-Knowledge Sanitization**: Passwords are kept out of query strings, application state persistence, and logs.
- **Phase 1 Mock State**: Forms validate completely in-memory with user-friendly feedback without transmitting live secrets.

---

## 🚀 What Comes in Phase 2 (Awaiting Approval)
Once you approve moving to Phase 2:
1. Connecting a real Supabase project (URL & Anon Key).
2. Setting up PostgreSQL profiles table and migrations.
3. Enabling PostgreSQL Row Level Security (RLS) policies.
4. Wiring up real email/password registration with Supabase Auth email confirmation.
5. Server-side session validation via Next.js SSR cookies (`@supabase/ssr`).
6. Configuring Google OAuth credentials in Google Cloud Console & Supabase dashboard.
7. Real email OTP password recovery dispatch and token validation.
