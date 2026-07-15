// prisma/seed-superadmin.ts
// Script to create the first SuperAdmin - runs once manually only

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

// Supabase client with service_role permissions (admin access)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Prisma client - needs adapter explicitly in Prisma 7
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
    const email = "ahmed.youssef.dev.52@gmail.com";
    const password = "NST@super_admin";
    const name = "Ahmed Youssef";

    const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: {
                role: "super_admin",
            },
        });

    if (authError) {
        console.error("Error creating user in Auth:", authError.message);
        return;
    }

    console.log("User created in Auth successfully, ID:", authUser.user.id);

    const superAdmin = await prisma.superAdmin.create({
        data: {
            id: authUser.user.id,
            email,
            name,
        },
    });

    console.log("Record created in super_admins successfully:", superAdmin);
}

createSuperAdmin()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());