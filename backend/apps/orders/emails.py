from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string


def send_order_confirmation(order):
    body = render_to_string(
        "orders/order_confirmation.txt",
        {"order": order, "items": order.items.all()},
    )
    send_mail(
        subject=f"Your Lumen order {order.reference}",
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.email],
    )
