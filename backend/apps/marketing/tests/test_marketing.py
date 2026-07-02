from django.core import mail
from rest_framework.test import APITestCase

from apps.marketing.models import Campaign, NewsletterSubscriber
from apps.marketing.services import send_campaign


class SubscribeApiTests(APITestCase):
    def test_subscribing_creates_a_subscriber(self):
        self.client.post("/api/newsletter/subscribe/", {"email": "a@b.com"}, format="json")
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_subscribing_twice_keeps_one_entry(self):
        self.client.post("/api/newsletter/subscribe/", {"email": "a@b.com"}, format="json")
        self.client.post("/api/newsletter/subscribe/", {"email": "a@b.com"}, format="json")
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_invalid_email_is_rejected(self):
        response = self.client.post("/api/newsletter/subscribe/", {"email": "nope"}, format="json")
        self.assertEqual(response.status_code, 400)


class CampaignSendTests(APITestCase):
    def test_campaign_emails_only_active_subscribers(self):
        NewsletterSubscriber.objects.create(email="a@b.com", is_active=True)
        NewsletterSubscriber.objects.create(email="c@d.com", is_active=True)
        NewsletterSubscriber.objects.create(email="gone@x.com", is_active=False)
        campaign = Campaign.objects.create(subject="News", body="Hello")
        send_campaign(campaign)
        self.assertEqual(len(mail.outbox), 2)

    def test_sending_records_sent_at(self):
        NewsletterSubscriber.objects.create(email="a@b.com", is_active=True)
        campaign = Campaign.objects.create(subject="News", body="Hello")
        send_campaign(campaign)
        campaign.refresh_from_db()
        self.assertIsNotNone(campaign.sent_at)
