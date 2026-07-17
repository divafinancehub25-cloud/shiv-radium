export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, basePrice, categoryId, deliveryDays, isActive, isFeatured, images, fields, previewPosition, features, sampleDesigns } = body;

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
        images: images ?? [],
        previewPosition: previewPosition || "center",
        features: features ?? undefined,
        sampleDesigns: sampleDesigns ?? [],
        salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
        discountPct: body.discountPct ? parseInt(body.discountPct) : null,
        manageStock: !!body.manageStock,
        stockQty: body.stockQty !== undefined && body.stockQty !== "" && body.stockQty !== null ? parseInt(body.stockQty) : null,
        stockStatus: body.stockStatus || "IN_STOCK",
        soldIndividually: !!body.soldIndividually,
        shippingClass: body.shippingClass || null,
        shippingCost: body.shippingCost ? parseFloat(body.shippingCost) : null,
        codAvailable: body.codAvailable !== false,
        weightGrams: body.weightGrams ? parseInt(body.weightGrams) : null,
        lengthIn: body.lengthIn ? parseFloat(body.lengthIn) : null,
        widthIn: body.widthIn ? parseFloat(body.widthIn) : null,
        heightIn: body.heightIn ? parseFloat(body.heightIn) : null,
        noReturnPolicy: !!body.noReturnPolicy,
        attributes: body.attributes ?? undefined,
        customizeEnabled: body.customizeEnabled !== false,
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
          maxFiles: parseInt(f.maxFiles) || 1,
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
