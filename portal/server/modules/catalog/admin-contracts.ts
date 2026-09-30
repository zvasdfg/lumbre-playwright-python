import { z } from "zod";
import { parseJsonBody } from "../commerce/cart-contracts";
import { ingredients } from "../../../app/lib/ingredients";

export { parseJsonBody };

const productDetails = z.object({
  productCode: z.string().regex(/^LMB-F-\d{3}$/),
  description: z.string().trim().min(3).max(1000),
  components: z.array(z.object({
    id: z.string().refine((id) => ingredients.some((item) => item.id === id)),
    nombre: z.string().trim().min(1).max(100),
    familia: z.string().trim().min(1).max(60),
  }).strict()).min(2).max(6).refine((items) => new Set(items.map((item) => item.id)).size === items.length),
  image: z.string().regex(/^\/editorial\/[a-zA-Z0-9/_-]+\.(jpeg|jpg|png|webp)$/),
  imageAlt: z.string().trim().min(3).max(200),
  netContent: z.string().trim().min(1).max(40),
}).strict();

const productFields = {
  name: z.string().trim().min(3).max(100),
  category: z.enum(["blends", "ropa", "herramientas", "outdoor"]),
  price: z.number().int().min(1).max(1_000_000),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  badge: z.string().trim().min(1).max(40).nullable().optional(),
  active: z.boolean().optional(),
  details: productDetails.optional(),
};

export const createProductRequest = z.object(productFields).strict().refine(
  (product) => product.category !== "blends" || Boolean(product.details),
  { message: "Blends require their public laboratory details" },
);
export const updateProductRequest = z
  .object({
    expectedRevision: z.number().int().min(1),
    name: productFields.name.optional(),
    category: productFields.category.optional(),
    price: productFields.price.optional(),
    stock: productFields.stock,
    badge: productFields.badge,
    active: productFields.active,
    details: productFields.details,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "expectedRevision"),
    { message: "At least one product field is required" },
  );

const eventFields = {
  day: z.string().regex(/^(0[1-9]|[12]\d|3[01])$/),
  month: z.string().regex(/^[A-ZÁÉÍÓÚ]{3}$/),
  city: z.string().trim().min(3).max(100),
  title: z.string().trim().min(3).max(120),
  detail: z.string().trim().min(3).max(240),
  capacity: z.number().int().min(1).max(10_000),
  active: z.boolean().optional(),
};

export const createEventRequest = z.object(eventFields).strict();
export const updateEventRequest = z
  .object({
    expectedRevision: z.number().int().min(1),
    day: eventFields.day.optional(),
    month: eventFields.month.optional(),
    city: eventFields.city.optional(),
    title: eventFields.title.optional(),
    detail: eventFields.detail.optional(),
    capacity: eventFields.capacity.optional(),
    active: eventFields.active,
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "expectedRevision"),
    { message: "At least one event field is required" },
  );

export type CreateProductInput = z.infer<typeof createProductRequest>;
export type UpdateProductInput = z.infer<typeof updateProductRequest>;
export type CreateEventInput = z.infer<typeof createEventRequest>;
export type UpdateEventInput = z.infer<typeof updateEventRequest>;
