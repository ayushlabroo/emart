// ─── Admin seed script ────────────────────────────────────────────────────────
//
// Register endpoint jaan-bujhke sirf CUSTOMER banata hai (koi khud ko ADMIN na
// bana le). Isliye admin user manually banana padta hai — yeh script wahi karti hai.
//
// Run: pnpm --filter @emart/api seed:admin
// Override defaults: ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --filter @emart/api seed:admin
//
// Idempotent: dobara chalao toh same email ka password reset ho jaata hai (upsert),
// duplicate nahi banta.
import { prisma } from "@emart/database";
import { UserRole } from "@emart/types";
import { hashPassword } from "../lib/password";

async function main() {
  // Defaults — production mein kabhi mat use karo, sirf local dev ke liye
  const email = process.env.ADMIN_EMAIL ?? "admin@emart.com";
  const phone = process.env.ADMIN_PHONE ?? "9999999999";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";

  const hashed = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    // Pehle se hai → role + password refresh karo (locked out na raho)
    update: { password: hashed, role: UserRole.ADMIN, isActive: true },
    // Naya → ADMIN user banao
    create: {
      email,
      phone,
      password: hashed,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });

  console.log("\n✅ Admin ready");
  console.log("   id   :", user.id);
  console.log("   email:", user.email);
  console.log("   role :", user.role);
  console.log("   password:", password, "\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed fail:", err);
    process.exit(1);
  });
