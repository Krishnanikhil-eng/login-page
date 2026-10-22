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
- **Protected Profile**: [http://localhost:3000/profile](http://localhost:3000/profile)
- **Password Recovery**: [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password)
- **Email Verification Hub**: [http://localhost:3000/auth/verify](http://localhost:3000/auth/verify)
- **OAuth Callback Route**: [http://localhost:3000/auth/callback](http://localhost:3000/auth/callback)

### 4. Run Phase 2 Security & Auth Tests
To verify all 19 Phase 2 security and authentication checks:
```bash
npm run test:phase2
```

### 5. Build for Production
To verify an optimized production bundle:
```bash
npm run build
```

To run the production server locally after building:
```bash
npm run start
```

---

## 🔒 Security & Architecture Details (Phase 2)
- **Supabase SSR with Next.js 16 Proxy**: Session tokens refreshed via `src/proxy.ts` and validated server-side via `supabase.auth.getUser()`.
- **PostgreSQL Row Level Security (RLS)**: `public.profiles` isolated with `auth.uid() = id`. User A can never access or mutate User B's profile.
- **Zero Sensitive Data in Profiles**: Passwords and OTP tokens are NEVER stored in `public.profiles`.
- **Lowercase Email Normalization**: Emails are strictly normalized to lowercase before API calls and database writes, with a database check constraint.
- **Account Enumeration Protection**: Public password recovery responses never reveal whether an email account exists.
- **Explicit Phone Identity Boundary**: Distinguishes email logins from phone inputs; clearly explains SMS provider setup requirements rather than failing silently.
- **Google OAuth Status Guard**: Marks unconfigured OAuth as pending and provides clear Google Cloud Console configuration guidance.
