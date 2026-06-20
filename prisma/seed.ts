import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually before any imports use process.env
const envPath = resolve(process.cwd(), ".env");
const envLines = readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient, FieldType } from "@prisma/client";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const adapter = new PrismaNeonHttp(dbUrl, {});
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding Shiv Radium database...");

  // ─── Categories ─────────────────────────────────────────────────────────────

  const existingCats = await prisma.category.findMany({ select: { slug: true } });
  const catSlugs = new Set(existingCats.map((c) => c.slug));

  const cats = [
    { name: "Photo Gifts", slug: "photo-gifts", description: "Personalized gifts made with your cherished photographs", icon: "🎁", sortOrder: 1 },
    { name: "Home Decor & Name Boards", slug: "home-decor", description: "Customized name plates, LED boards and neon signs", icon: "🏠", sortOrder: 2 },
    { name: "Personalized Gifts", slug: "personalized-gifts", description: "Keychains, pens, journals and more with your name", icon: "🎨", sortOrder: 3 },
    { name: "Corporate Branding", slug: "corporate-gifts", description: "Branded merchandise and gift kits for businesses", icon: "🏢", sortOrder: 4 },
    { name: "Event & Occasion Gifts", slug: "event-gifts", description: "Special gifts for birthdays, weddings, anniversaries", icon: "🎉", sortOrder: 5 },
  ];

  for (const cat of cats) {
    if (!catSlugs.has(cat.slug)) {
      await prisma.category.create({ data: cat });
    }
  }

  const allCats = await prisma.category.findMany();
  const catMap = Object.fromEntries(allCats.map((c) => [c.slug, c]));
  console.log("✓ Categories ready");

  // ─── Helper: upsert product & fields ────────────────────────────────────────

  async function upsertProduct(data: {
    categorySlug: string;
    slug: string;
    name: string;
    description: string;
    basePrice: number;
    isFeatured?: boolean;
    deliveryDays?: number;
  }) {
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) return existing;
    return prisma.product.create({
      data: {
        categoryId: catMap[data.categorySlug].id,
        slug: data.slug,
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        images: [],
        isFeatured: data.isFeatured ?? false,
        deliveryDays: data.deliveryDays ?? 5,
      },
    });
  }

  async function upsertField(productId: string, data: {
    label: string; fieldKey: string; type: FieldType;
    isRequired?: boolean; sortOrder?: number; placeholder?: string;
  }) {
    const existing = await prisma.productField.findUnique({ where: { productId_fieldKey: { productId, fieldKey: data.fieldKey } } });
    if (existing) return existing;
    return prisma.productField.create({ data: { productId, ...data } });
  }

  async function upsertOption(fieldId: string, data: { label: string; value: string; price?: number; sortOrder?: number }) {
    const existing = await prisma.fieldOption.findFirst({ where: { fieldId, value: data.value } });
    if (!existing) await prisma.fieldOption.create({ data: { fieldId, ...data } });
  }

  // ─── Product 1: Custom Photo Frame ──────────────────────────────────────────

  const photoFrame = await upsertProduct({ categorySlug: "photo-gifts", slug: "custom-photo-frame", name: "Custom Photo Frame", description: "Premium wooden/MDF/acrylic photo frame with personalized photographs and text.", basePrice: 499, isFeatured: true, deliveryDays: 5 });

  const pf1 = await upsertField(photoFrame.id, { label: "Upload Photo", fieldKey: "photo", type: FieldType.IMAGE_UPLOAD, isRequired: true, sortOrder: 1 });
  const pf2 = await upsertField(photoFrame.id, { label: "Frame Type", fieldKey: "frame_type", type: FieldType.RADIO, isRequired: true, sortOrder: 2 });
  const pf3 = await upsertField(photoFrame.id, { label: "Frame Size", fieldKey: "frame_size", type: FieldType.DROPDOWN, isRequired: true, sortOrder: 3 });
  const pf4 = await upsertField(photoFrame.id, { label: "Orientation", fieldKey: "orientation", type: FieldType.RADIO, isRequired: true, sortOrder: 4 });
  await upsertField(photoFrame.id, { label: "Custom Text / Quote", fieldKey: "custom_text", type: FieldType.TEXTAREA, isRequired: false, sortOrder: 5, placeholder: "Add a personal message..." });
  await upsertField(photoFrame.id, { label: "Frame Color", fieldKey: "frame_color", type: FieldType.COLOR_PICKER, isRequired: false, sortOrder: 6 });
  await upsertField(photoFrame.id, { label: "Gift Message", fieldKey: "gift_message", type: FieldType.TEXTAREA, isRequired: false, sortOrder: 7, placeholder: "Message to include with gift..." });
  await upsertField(photoFrame.id, { label: "Delivery Date", fieldKey: "delivery_date", type: FieldType.DATE, isRequired: false, sortOrder: 8 });

  for (const o of [
    { label: "Wooden Frame", value: "wooden", price: 0, sortOrder: 1 },
    { label: "MDF Frame", value: "mdf", price: 0, sortOrder: 2 },
    { label: "Acrylic Frame", value: "acrylic", price: 200, sortOrder: 3 },
    { label: "LED Frame", value: "led", price: 500, sortOrder: 4 },
  ]) await upsertOption(pf2.id, o);

  for (const o of [
    { label: "5x7 inch", value: "5x7", price: 0, sortOrder: 1 },
    { label: "8x10 inch", value: "8x10", price: 100, sortOrder: 2 },
    { label: "12x18 inch", value: "12x18", price: 300, sortOrder: 3 },
    { label: "16x20 inch", value: "16x20", price: 500, sortOrder: 4 },
  ]) await upsertOption(pf3.id, o);

  for (const o of [
    { label: "Portrait", value: "portrait", sortOrder: 1 },
    { label: "Landscape", value: "landscape", sortOrder: 2 },
  ]) await upsertOption(pf4.id, o);

  // ─── Product 2: Photo Coffee Mug ────────────────────────────────────────────

  const mug = await upsertProduct({ categorySlug: "photo-gifts", slug: "photo-coffee-mug", name: "Photo Coffee Mug", description: "Customized ceramic mug with your photo and personal message.", basePrice: 349, isFeatured: true, deliveryDays: 4 });

  await upsertField(mug.id, { label: "Upload Photo", fieldKey: "photo", type: FieldType.IMAGE_UPLOAD, isRequired: true, sortOrder: 1 });
  const mf2 = await upsertField(mug.id, { label: "Mug Type", fieldKey: "mug_type", type: FieldType.RADIO, isRequired: true, sortOrder: 2 });
  await upsertField(mug.id, { label: "Personalized Text", fieldKey: "custom_text", type: FieldType.TEXT, isRequired: false, sortOrder: 3, placeholder: "Name or message on mug..." });
  await upsertField(mug.id, { label: "Quantity", fieldKey: "quantity", type: FieldType.QUANTITY, isRequired: true, sortOrder: 4 });

  for (const o of [
    { label: "White Mug", value: "white", price: 0, sortOrder: 1 },
    { label: "Magic Mug (color change)", value: "magic", price: 150, sortOrder: 2 },
    { label: "Inner Color Mug", value: "inner_color", price: 100, sortOrder: 3 },
  ]) await upsertOption(mf2.id, o);

  // ─── Product 3: House Name Plate ────────────────────────────────────────────

  const namePlate = await upsertProduct({ categorySlug: "home-decor", slug: "house-name-plate", name: "House Name Plate", description: "Customized home entrance name plate in your choice of material, font and language.", basePrice: 699, isFeatured: true, deliveryDays: 7 });

  await upsertField(namePlate.id, { label: "House / Family Name", fieldKey: "house_name", type: FieldType.TEXT, isRequired: true, sortOrder: 1, placeholder: "e.g. The Sharma Family" });
  await upsertField(namePlate.id, { label: "Address (Optional)", fieldKey: "address", type: FieldType.TEXTAREA, isRequired: false, sortOrder: 2, placeholder: "House no, Street..." });
  const nf3 = await upsertField(namePlate.id, { label: "Preferred Language", fieldKey: "language", type: FieldType.RADIO, isRequired: true, sortOrder: 3 });
  await upsertField(namePlate.id, { label: "Font Style", fieldKey: "font_style", type: FieldType.DROPDOWN, isRequired: true, sortOrder: 4 });
  const nf5 = await upsertField(namePlate.id, { label: "Material", fieldKey: "material", type: FieldType.RADIO, isRequired: true, sortOrder: 5 });
  await upsertField(namePlate.id, { label: "Size", fieldKey: "size", type: FieldType.DROPDOWN, isRequired: true, sortOrder: 6 });

  for (const o of [
    { label: "English", value: "english", sortOrder: 1 },
    { label: "Hindi", value: "hindi", sortOrder: 2 },
    { label: "English + Hindi", value: "both", sortOrder: 3 },
  ]) await upsertOption(nf3.id, o);

  for (const o of [
    { label: "Acrylic", value: "acrylic", price: 0, sortOrder: 1 },
    { label: "Steel", value: "steel", price: 200, sortOrder: 2 },
    { label: "Wood", value: "wood", price: 100, sortOrder: 3 },
    { label: "ACP", value: "acp", price: 300, sortOrder: 4 },
  ]) await upsertOption(nf5.id, o);

  // ─── Product 4: Photo Clock ──────────────────────────────────────────────────

  const clock = await upsertProduct({ categorySlug: "photo-gifts", slug: "photo-clock", name: "Photo Clock", description: "Wall clock with customized family or personal photographs.", basePrice: 599, isFeatured: false, deliveryDays: 5 });

  await upsertField(clock.id, { label: "Upload Photo", fieldKey: "photo", type: FieldType.IMAGE_UPLOAD, isRequired: true, sortOrder: 1 });
  const cf2 = await upsertField(clock.id, { label: "Clock Shape", fieldKey: "clock_shape", type: FieldType.RADIO, isRequired: true, sortOrder: 2 });
  const cf3 = await upsertField(clock.id, { label: "Clock Size", fieldKey: "clock_size", type: FieldType.DROPDOWN, isRequired: true, sortOrder: 3 });
  await upsertField(clock.id, { label: "Text on Clock", fieldKey: "custom_text", type: FieldType.TEXT, isRequired: false, sortOrder: 4, placeholder: "Family name or quote..." });

  for (const o of [
    { label: "Round", value: "round", sortOrder: 1 },
    { label: "Square", value: "square", sortOrder: 2 },
    { label: "Heart", value: "heart", sortOrder: 3 },
  ]) await upsertOption(cf2.id, o);

  for (const o of [
    { label: "10 inch", value: "10", price: 0, sortOrder: 1 },
    { label: "12 inch", value: "12", price: 150, sortOrder: 2 },
  ]) await upsertOption(cf3.id, o);

  // ─── Product 5: Personalized Keychain ───────────────────────────────────────

  const keychain = await upsertProduct({ categorySlug: "personalized-gifts", slug: "personalized-keychain", name: "Personalized Keychain", description: "Custom keychain with name, photo or message. Perfect gifting option.", basePrice: 199, isFeatured: false, deliveryDays: 3 });

  await upsertField(keychain.id, { label: "Name / Text", fieldKey: "name_text", type: FieldType.TEXT, isRequired: true, sortOrder: 1, placeholder: "Name or short text..." });
  await upsertField(keychain.id, { label: "Photo (Optional)", fieldKey: "photo", type: FieldType.IMAGE_UPLOAD, isRequired: false, sortOrder: 2 });
  const kf3 = await upsertField(keychain.id, { label: "Material", fieldKey: "material", type: FieldType.RADIO, isRequired: true, sortOrder: 3 });

  for (const o of [
    { label: "Metal", value: "metal", price: 0, sortOrder: 1 },
    { label: "Acrylic", value: "acrylic", price: 0, sortOrder: 2 },
    { label: "Leather", value: "leather", price: 50, sortOrder: 3 },
  ]) await upsertOption(kf3.id, o);

  // ─── Product 6: Corporate Gift Kit ──────────────────────────────────────────

  const corpKit = await upsertProduct({ categorySlug: "corporate-gifts", slug: "corporate-gift-kit", name: "Corporate Gift Kit", description: "Complete branded gift kit for employees and clients. Includes pen, diary, keychain, mug and more.", basePrice: 1499, isFeatured: true, deliveryDays: 10 });

  await upsertField(corpKit.id, { label: "Company Name", fieldKey: "company_name", type: FieldType.TEXT, isRequired: true, sortOrder: 1, placeholder: "Your company name..." });
  await upsertField(corpKit.id, { label: "Company Logo", fieldKey: "logo", type: FieldType.FILE_UPLOAD, isRequired: true, sortOrder: 2 });
  await upsertField(corpKit.id, { label: "Employee Name", fieldKey: "employee_name", type: FieldType.TEXT, isRequired: false, sortOrder: 3, placeholder: "For single personalization..." });
  await upsertField(corpKit.id, { label: "Quantity", fieldKey: "quantity", type: FieldType.QUANTITY, isRequired: true, sortOrder: 4 });

  console.log("✓ Products & fields created");

  // ─── Default Settings ────────────────────────────────────────────────────────

  const settings = [
    { key: "store_name", value: "Shiv Radium" },
    { key: "store_phone", value: "+91 00000 00000" },
    { key: "shipping_charge", value: "99" },
    { key: "free_shipping_above", value: "999" },
  ];
  for (const s of settings) {
    const exists = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!exists) await prisma.setting.create({ data: s });
  }

  console.log("✓ Settings created");
  console.log("\n🎉 Seed complete!");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
