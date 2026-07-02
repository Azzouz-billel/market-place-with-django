from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import NewsletterSubscriber


def send_campaign(campaign):
    """Email a campaign to every active subscriber; returns the recipient count.

    Sent synchronously via the configured email backend (console in dev). For
    large lists this should move to a Celery task.
    """
    recipients = list(
        NewsletterSubscriber.objects.filter(is_active=True).values_list("email", flat=True)
    )
    for email in recipients:
        send_mail(campaign.subject, campaign.body, settings.DEFAULT_FROM_EMAIL, [email])
    campaign.sent_at = timezone.now()
    campaign.save(update_fields=["sent_at"])
    return len(recipients)
