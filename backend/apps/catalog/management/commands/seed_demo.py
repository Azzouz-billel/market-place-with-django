import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from PIL import Image, ImageDraw

from apps.catalog.models import Category, Product, ProductImage, ProductVariant
from apps.currencies.models import Currency
from apps.discounts.models import Coupon

# (category name, [(product name, price, [(variant name, sku suffix, stock, price_override)])])
DEMO_DATA = {
    "Apparel": [
        ("Classic Cotton Tee", "24.00", [("Small", "S", 12, None), ("Medium", "M", 30, None), ("Large", "L", 8, None)]),
        ("Merino Wool Hoodie", "89.00", [("Medium", "M", 15, None), ("Large", "L", 5, "94.00")]),
        ("Linen Summer Shirt", "59.00", [("Small", "S", 0, None), ("Medium", "M", 20, None)]),
    ],
    "Footwear": [
        ("Trail Running Shoe", "129.00", [("EU 42", "42", 10, None), ("EU 43", "43", 4, None)]),
        ("Leather Chelsea Boot", "189.00", [("EU 42", "42", 6, None), ("EU 44", "44", 0, None)]),
    ],
    "Accessories": [
        ("Canvas Weekender Bag", "74.00", [("One Size", "OS", 25, None)]),
        ("Stainless Water Bottle", "29.00", [("500ml", "500", 40, None), ("750ml", "750", 18, "34.00")]),
    ],
}

COLORS = ["#1f2937", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#4d7c0f"]


def _placeholder_image(label, color):
    img = Image.new("RGB", (800, 800), color)
    draw = ImageDraw.Draw(img)
    draw.text((40, 380), label, fill="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=80)
    return ContentFile(buffer.getvalue())


class Command(BaseCommand):
    help = "Populate demo categories, products, variants, and placeholder images."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing catalog data first.")

    def handle(self, *args, **options):
        if options["reset"]:
            ProductVariant.objects.all().delete()
            ProductImage.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Coupon.objects.all().delete()
            self.stdout.write("Cleared existing catalog data.")

        for code, name, symbol, rate, default in [
            ("USD", "US Dollar", "$", "1.000000", True),
            ("EUR", "Euro", "€", "0.920000", False),
            ("GBP", "British Pound", "£", "0.790000", False),
            ("DZD", "Algerian Dinar", "DA", "134.000000", False),
        ]:
            Currency.objects.get_or_create(
                code=code,
                defaults={"name": name, "symbol": symbol, "rate": rate, "is_default": default},
            )

        Coupon.objects.get_or_create(
            code="WELCOME10",
            defaults={"discount_type": Coupon.DiscountType.PERCENT, "value": "10.00"},
        )
        Coupon.objects.get_or_create(
            code="SAVE15",
            defaults={
                "discount_type": Coupon.DiscountType.FIXED,
                "value": "15.00",
                "min_subtotal": "75.00",
            },
        )

        color_cycle = iter(COLORS * 5)
        for cat_name, products in DEMO_DATA.items():
            category, _ = Category.objects.get_or_create(
                slug=slugify(cat_name), defaults={"name": cat_name}
            )
            for prod_name, price, variants in products:
                slug = slugify(prod_name)
                if Product.objects.filter(slug=slug).exists():
                    continue
                product = Product.objects.create(
                    name=prod_name,
                    slug=slug,
                    description=f"A demo {prod_name.lower()} for the {cat_name.lower()} catalog.",
                    category=category,
                    base_price=price,
                    meta_title=f"{prod_name} | Demo Store",
                    meta_description=f"Buy the {prod_name} — part of our {cat_name.lower()} collection.",
                )
                image = ProductImage.objects.create(
                    product=product, alt_text=prod_name, is_primary=True
                )
                image.image.save(f"{slug}.jpg", _placeholder_image(prod_name, next(color_cycle)), save=True)
                for variant_name, sku_suffix, stock, override in variants:
                    ProductVariant.objects.create(
                        product=product,
                        name=variant_name,
                        sku=f"{slug}-{sku_suffix}".upper(),
                        stock_quantity=stock,
                        price_override=override,
                    )

        self.stdout.write(self.style.SUCCESS(
            f"Seed complete: {Category.objects.count()} categories, {Product.objects.count()} products."
        ))
