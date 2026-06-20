import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, basePrice, categoryId, deliveryDays, isActive, isFeatured, fields } = body;

    const product = await db.product.create({
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

    // Create fields
    for (let i = 0; i < (fields ?? []).length; i++) {
      const f = fields[i];
      const field = await db.productField.create({
        data: {
          productId: product.id,
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

    return NextResponse.json({ id: product.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
