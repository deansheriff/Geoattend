import pkg from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const seedPath = path.resolve("prisma", "seed.json");
const raw = fs.readFileSync(seedPath, "utf-8");
const seed = JSON.parse(raw);

async function main() {
  const tenant = await prisma.tenant.create({
    data: {
      name: seed.tenant.name,
      slug: seed.tenant.slug
    }
  });

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const employeePassword = await bcrypt.hash("Employee123!", 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@geoattend.local",
      name: "Admin User",
      role: "ADMIN",
      passwordHash: adminPassword,
      timezone: "America/Los_Angeles"
    }
  });

  const employee = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "employee@geoattend.local",
      name: "Employee User",
      role: "EMPLOYEE",
      passwordHash: employeePassword,
      timezone: "America/Los_Angeles"
    }
  });

  for (const loc of seed.locations) {
    const location = await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters: loc.radiusMeters,
        createdById: admin.id
      }
    });

    await prisma.userLocationAssignment.create({
      data: {
        tenantId: tenant.id,
        userId: employee.id,
        locationId: location.id
      }
    });
  }

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
