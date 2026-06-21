export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, basePrice, categoryId, deliveryDays, isActive, isFeatured, fields } = body;

    await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        basePrice: parseFloat(basePrice),
        categoryId,
        deliveryDays: parseInt(deliveryDays) || 5,
        isActive,
        isFeatured,
      },
    });

    // Delete existing fields and recreate
    const existingFields = await db.productField.findMany({ where: { productId: id }, select: { id: true } });
    for (const ef of existingFields) {
      await db.fieldOption.deleteMany({ where: { fieldId: ef.id } });
    }
    await db.productField.deleteMany({ where: { productId: id } });

    for (let i = 0; i < (fields ?? []).length; i++) {
      const f = fields[i];
      const field = await db.productField.create({
        data: {
          productId: id,
          label: f.label,
          fieldKey: f.fieldKey,
          type: f.type,
          placeholder: f.placeholder || null,
          helpText: f.helpText || null,
          isRequired: f.isRequired,
          sortOrder: i,
        },
      });
      for (let j = 0; j < (f.options ?? []).length; j++) {
        const o = f.options[j];
        await db.fieldOption.create({
          data: {
            fieldId: field.id,
            label: o.label,
            value: o.value,
            price: o.price ? parseFloat(o.price) : null,
            sortOrder: j,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
