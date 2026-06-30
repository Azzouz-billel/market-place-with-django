from .models import Coupon


class CouponError(Exception):
    """Raised when a coupon code cannot be applied."""


def get_valid_coupon(code, subtotal):
    """Return an active, in-window coupon for the code, or raise CouponError."""
    coupon = Coupon.objects.filter(code=code.upper().strip()).first()
    if coupon is None:
        raise CouponError("That coupon code isn't recognised.")
    if not coupon.active:
        raise CouponError("This coupon is no longer active.")
    if not coupon.is_valid(subtotal):
        if subtotal < coupon.min_subtotal:
            raise CouponError(f"Spend at least ${coupon.min_subtotal} to use this coupon.")
        raise CouponError("This coupon has expired.")
    return coupon
